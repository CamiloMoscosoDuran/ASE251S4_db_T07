#!/bin/sh
set -eu
cd /lab

MONGO_HOST="${MONGO_HOST:-mongodb}"
MONGO_ADMIN_USER="${MONGO_ADMIN_USER:-admin}"
MONGO_ADMIN_PASSWORD="${MONGO_ADMIN_PASSWORD:?Falta MONGO_ADMIN_PASSWORD}"
MONGO_DATABASE="${MONGO_DATABASE:-AgroTecnoDB}"
TARGET_SCHEMA_VERSION="${TARGET_SCHEMA_VERSION:-latest}"
GIT_SHA="${GIT_SHA:-local}"
RELEASE_VERSION="${RELEASE_VERSION:-local}"
export MONGO_ADMIN_USER MONGO_ADMIN_PASSWORD MONGO_DATABASE TARGET_SCHEMA_VERSION GIT_SHA RELEASE_VERSION

mongosh_auth() {
  mongosh \
    --host "$MONGO_HOST" \
    --username "$MONGO_ADMIN_USER" \
    --password "$MONGO_ADMIN_PASSWORD" \
    --authenticationDatabase admin \
    --quiet \
    "$1"
}

mongo_eval() {
  mongosh \
    --host "$MONGO_HOST" \
    --username "$MONGO_ADMIN_USER" \
    --password "$MONGO_ADMIN_PASSWORD" \
    --authenticationDatabase admin \
    --quiet \
    --eval "var adminDb=db.getSiblingDB('admin'); if(!adminDb.auth(process.env.MONGO_ADMIN_USER,process.env.MONGO_ADMIN_PASSWORD)) throw Error('Autenticación MongoDB fallida'); var labDb=db.getSiblingDB(process.env.MONGO_DATABASE); $1"
}

history_exists() {
  result="$(mongo_eval "print(labDb.getCollectionInfos({name:'schema_changes'}).length)")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = 1 ]
}

baseline_complete() {
  result="$(mongo_eval "print(['customers','supplies','formulas','field_meetings'].every(name => labDb.getCollectionInfos({name:name}).length === 1))")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = true ]
}

database_is_empty() {
  result="$(mongo_eval "print(labDb.getCollectionNames().length === 0)")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = true ]
}

script_sequence() {
  name="${1##*/}"
  case "$name" in
    V[0-9][0-9][0-9]_*.js|V[0-9][0-9][0-9]_*.json) ;;
    *) echo "Nombre de cambio inválido: $name" >&2; exit 2 ;;
  esac
  digits="${name#V}"
  digits="${digits%%_*}"
  sequence="$(printf '%s' "$digits" | sed 's/^0*//')"
  printf '%s' "${sequence:-0}"
}

record_change() {
  script="$1"
  sequence="$2"
  checksum="$3"
  name="${script##*/}"
  change_id="${name%.*}"
  export CHANGE_SEQUENCE="$sequence"
  export CHANGE_ID="$change_id"
  export CHANGE_CHECKSUM="$checksum"
  mongosh_auth metadata/record-change.js
}

apply_json_migration() {
  script="$1"
  migration_json="$(tr -d '\r\n' < "$script")"
  MIGRATION_JSON="$migration_json" mongosh \
    --host "$MONGO_HOST" \
    --username "$MONGO_ADMIN_USER" \
    --password "$MONGO_ADMIN_PASSWORD" \
    --authenticationDatabase admin \
    --quiet \
    --eval '
      var adminDb = db.getSiblingDB("admin");
      if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
        throw Error("Autenticación MongoDB fallida");
      }
      var spec = JSON.parse(process.env.MIGRATION_JSON);
      var labDb = db.getSiblingDB(spec.database);
      var collection = labDb.getCollection(spec.collection);
      var info = labDb.getCollectionInfos({name: spec.collection})[0];
      if (!info || !info.options.validator || !info.options.validator.$jsonSchema) {
        throw Error("No existe el validador JSON Schema de " + spec.collection);
      }

      var validator = info.options.validator;
      var identifier = spec.identifierMigration;
      function migratedId(value) {
        var suffix = value.slice(identifier.fromPrefix.length).replace(/^0+/, "");
        return identifier.toPrefix + suffix.padStart(3, "0");
      }
      validator.$jsonSchema.properties._id.pattern = "^" + identifier.fromPrefix + "[0-9]{3,}$|^" + identifier.toPrefix + "[0-9]{3,}$";
      var command = {collMod: spec.collection, validator: validator};
      command.validationLevel = spec.validationLevel;
      command.validationAction = spec.validationAction;
      var result = labDb.runCommand(command);
      if (result.ok !== 1) throw Error("No se pudo preparar el validador: " + tojson(result));

      var oldPattern = new RegExp("^" + identifier.fromPrefix + "[0-9]{3,}$");
      var oldDocuments = collection.find({_id: oldPattern}).toArray();
      for (var document of oldDocuments) {
        var oldId = document._id;
        var newId = migratedId(oldId);
        var existing = collection.findOne({_id: newId});
        if (existing) {
          document._id = newId;
          if (EJSON.stringify(existing) !== EJSON.stringify(document)) {
            throw Error("Ya existe " + newId + " con datos diferentes");
          }
          collection.deleteOne({_id: oldId});
        } else {
          collection.deleteOne({_id: oldId});
          document._id = newId;
          try {
            collection.insertOne(document);
          } catch (error) {
            document._id = oldId;
            collection.insertOne(document);
            throw error;
          }
        }
      }

      for (var reference of spec.references) {
        var refCollection = labDb.getCollection(reference.collection);
        var selector = {};
        selector[reference.field] = oldPattern;
        var refDocuments = refCollection.find(selector).toArray();
        for (var refDocument of refDocuments) {
          var update = {$set: {}};
            update.$set[reference.field] = migratedId(refDocument[reference.field]);
          refCollection.updateOne({_id: refDocument._id}, update);
        }
      }

      validator.$jsonSchema.properties._id.pattern = identifier.validatorPattern;
      result = labDb.runCommand(command);
      if (result.ok !== 1) throw Error("No se pudo fijar el validador final: " + tojson(result));
      print("MongoDB: IDs " + identifier.fromPrefix + " migrados a " + identifier.toPrefix);
    '
}

apply_script() {
  script="$1"
  name="${script##*/}"
  sequence="$(script_sequence "$script")"
  checksum="$(sha256sum "$script" | awk '{print $1}')"
  applied=0

  if history_exists; then
    applied="$(mongo_eval "print(labDb.schema_changes.countDocuments({sequence:NumberInt($sequence)}))")"
    applied="$(printf '%s' "$applied" | tr -d '[:space:]')"
  fi

  if [ "$applied" -gt 0 ]; then
    stored="$(mongo_eval "print(labDb.schema_changes.findOne({sequence:NumberInt($sequence)}).checksum)")"
    [ "$stored" = "$checksum" ] || { echo "Checksum modificado para $name" >&2; exit 3; }
    echo "MongoDB: $name ya aplicado"
    return
  fi

  echo "MongoDB: aplicando ${name%.*}"
  case "$script" in
    *.js) mongosh_auth "$script" ;;
    *.json) apply_json_migration "$script" ;;
  esac
  record_change "$script" "$sequence" "$checksum"
}

latest_version=1
for candidate in changes/V*.js changes/V*.json; do
  [ -e "$candidate" ] || continue
  sequence="$(script_sequence "$candidate")"
  if [ "$sequence" -gt "$latest_version" ]; then
    latest_version="$sequence"
  fi
done
if [ "$TARGET_SCHEMA_VERSION" = latest ]; then
  TARGET_SCHEMA_VERSION="$latest_version"
  export TARGET_SCHEMA_VERSION
fi
case "$TARGET_SCHEMA_VERSION" in ''|*[!0-9]*|0) echo 'TARGET_SCHEMA_VERSION debe ser latest o un entero positivo' >&2; exit 2 ;; esac
[ "$TARGET_SCHEMA_VERSION" -le "$latest_version" ] || {
  echo "No existe el contrato $TARGET_SCHEMA_VERSION; último disponible: $latest_version" >&2
  exit 2
}

expected=2
for candidate in changes/V*.js changes/V*.json; do
  [ -e "$candidate" ] || continue
  sequence="$(script_sequence "$candidate")"
  [ "$sequence" -eq "$expected" ] || {
    echo "Se esperaba V$(printf '%03d' "$expected") y apareció $candidate" >&2
    exit 2
  }
  expected=$((expected + 1))
done

reconcile() {
  baseline='bootstrap/V001__baseline.js'
  [ -f "$baseline" ] || { echo "No se encontró $baseline" >&2; exit 2; }

  if history_exists; then
    apply_script "$baseline"
  elif baseline_complete; then
    echo 'MongoDB: registrando baseline existente sin volver a ejecutarlo'
    checksum="$(sha256sum "$baseline" | awk '{print $1}')"
    record_change "$baseline" 1 "$checksum"
  elif database_is_empty; then
    apply_script "$baseline"
  else
    echo 'MongoDB: base parcial sin historial; se requiere revisión manual' >&2
    exit 4
  fi

  expected=2
  for script in changes/V*.js changes/V*.json; do
    [ -e "$script" ] || continue
    sequence="$(script_sequence "$script")"
    [ "$sequence" -le "$TARGET_SCHEMA_VERSION" ] || continue
    [ "$sequence" -eq "$expected" ] || {
      echo "Se esperaba V$(printf '%03d' "$expected") y apareció $script" >&2
      exit 2
    }
    apply_script "$script"
    expected=$((expected + 1))
  done

  current="$(mongo_eval "print(labDb.schema_changes.find().sort({sequence:-1}).limit(1).next().sequence)")"
  current="$(printf '%s' "$current" | tr -d '[:space:]')"
  [ "$current" -le "$TARGET_SCHEMA_VERSION" ] || {
    echo "La base ya está en V$current; no se permite retroceder a V$TARGET_SCHEMA_VERSION" >&2
    exit 2
  }
  mongosh_auth checks/contract.js
}

action="${1:-reconcile}"
case "$action" in
  reconcile|init|migrate) reconcile ;;
  check|verify) mongosh_auth checks/contract.js ;;
  *) echo 'Uso: reconcile | verify' >&2; exit 2 ;;
esac

echo "MongoDB: listo."