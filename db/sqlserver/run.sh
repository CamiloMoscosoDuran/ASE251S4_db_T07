#!/bin/sh
set -eu
cd /lab

SQL_HOST="${SQL_HOST:-sqlserver}"
SQL_USER="${SQL_USER:-sa}"
SQL_DATABASE="agroTecno_db"
SQL_PASSWORD="${SQL_PASSWORD:?Falta SQL_PASSWORD}"
TARGET_SCHEMA_VERSION="${TARGET_SCHEMA_VERSION:-latest}"
GIT_SHA="${GIT_SHA:-local}"
RELEASE_VERSION="${RELEASE_VERSION:-local}"
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

run_sqlcmd() {
  "$SQLCMD" -b -S "$SQL_HOST" -U "$SQL_USER" -P "$SQL_PASSWORD" -C "$@"
}

query_master() {
  run_sqlcmd -h -1 -W -Q "SET NOCOUNT ON; $1"
}

query_database() {
  run_sqlcmd -d "$SQL_DATABASE" -h -1 -W -Q "SET NOCOUNT ON; $1"
}

database_exists() {
  result="$(query_master "SELECT COUNT(*) FROM sys.databases WHERE name = N'$SQL_DATABASE';")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = 1 ]
}

history_exists() {
  result="$(query_database "SELECT CASE WHEN OBJECT_ID(N'dbo.schema_changes', N'U') IS NULL THEN 0 ELSE 1 END;")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = 1 ]
}

baseline_complete() {
  result="$(query_database "SELECT CASE WHEN
    OBJECT_ID(N'seguridad.[user]', N'U') IS NOT NULL AND
    OBJECT_ID(N'ventas.sales_order', N'U') IS NOT NULL AND
    OBJECT_ID(N'ventas.order_detail', N'U') IS NOT NULL AND
    OBJECT_ID(N'cobranzas.payment_collection', N'U') IS NOT NULL AND
    OBJECT_ID(N'cobranzas.collection_detail', N'U') IS NOT NULL AND
    OBJECT_ID(N'cobranzas.installment', N'U') IS NOT NULL AND
    OBJECT_ID(N'ventas.vw_resumen_ordenes', N'V') IS NOT NULL AND
    OBJECT_ID(N'ventas.sp_crear_orden_con_detalles', N'P') IS NOT NULL
    THEN 1 ELSE 0 END;")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = 1 ]
}

database_is_empty() {
  result="$(query_database "SELECT CASE WHEN NOT EXISTS
    (SELECT 1 FROM sys.objects WHERE is_ms_shipped = 0 AND type IN ('U', 'V', 'P'))
    THEN 1 ELSE 0 END;")"
  [ "$(printf '%s' "$result" | tr -d '[:space:]')" = 1 ]
}

script_sequence() {
  name="${1##*/}"
  case "$name" in V[0-9][0-9][0-9]_*.sql) ;; *) echo "Nombre de migración inválido: $name" >&2; exit 2 ;; esac
  digits="${name#V}"
  digits="${digits%%_*}"
  sequence="$(printf '%s' "$digits" | sed 's/^0*//')"
  printf '%s' "${sequence:-0}"
}

sql_literal() {
  printf '%s' "$1" | sed "s/'/''/g"
}

record_change() {
  sequence="$1"
  change_id="$2"
  checksum="$3"
  git_sha_sql="$(sql_literal "$GIT_SHA")"
  release_sql="$(sql_literal "$RELEASE_VERSION")"
  change_id_sql="$(sql_literal "$change_id")"
  run_sqlcmd -d "$SQL_DATABASE" \
    -v "change_sequence=$sequence" \
    -v "change_id=$change_id_sql" \
    -v "change_checksum=$checksum" \
    -v "git_sha=$git_sha_sql" \
    -v "release_version=$release_sql" \
    -i metadata/record-change.sql
}

verify_contract() {
  run_sqlcmd -d "$SQL_DATABASE" \
    -v "target_schema_version=$TARGET_SCHEMA_VERSION" \
    -i checks/contract.sql
}

verify_or_apply() {
  script="$1"
  sequence="$(script_sequence "$script")"
  name="${script##*/}"
  change_id="${name%.sql}"
  checksum="$(sha256sum "$script" | awk '{print $1}')"

  if history_exists; then
    count="$(query_database "SELECT COUNT(*) FROM dbo.schema_changes WHERE [sequence] = $sequence;")"
    count="$(printf '%s' "$count" | tr -d '[:space:]')"
  else
    count=0
  fi

  if [ "$count" -gt 0 ]; then
    stored="$(query_database "SELECT checksum FROM dbo.schema_changes WHERE [sequence] = $sequence;")"
    stored="$(printf '%s' "$stored" | tr -d '[:space:]')"
    [ "$stored" = "$checksum" ] || { echo "Checksum modificado para $name" >&2; exit 3; }
    echo "SQL Server: $change_id ya aplicado"
    return
  fi

  echo "SQL Server: aplicando $change_id"
  run_sqlcmd -d "$SQL_DATABASE" -i "$script"
  record_change "$sequence" "$change_id" "$checksum"
}

baseline=""
for script in bootstrap/V001_*.sql; do
  [ -e "$script" ] || continue
  [ -z "$baseline" ] || { echo 'Solo se permite un baseline V001' >&2; exit 2; }
  baseline="$script"
done
[ -n "$baseline" ] || { echo 'No se encontró bootstrap/V001_*.sql' >&2; exit 2; }

latest_version=1
for candidate in changes/V*.sql; do
  [ -e "$candidate" ] || continue
  sequence="$(script_sequence "$candidate")"
  if [ "$sequence" -gt "$latest_version" ]; then
    latest_version="$sequence"
  fi
done
if [ "$TARGET_SCHEMA_VERSION" = latest ]; then
  TARGET_SCHEMA_VERSION="$latest_version"
fi
case "$TARGET_SCHEMA_VERSION" in ''|*[!0-9]*|0) echo 'TARGET_SCHEMA_VERSION debe ser latest o un entero positivo' >&2; exit 2 ;; esac
[ "$TARGET_SCHEMA_VERSION" -le "$latest_version" ] || {
  echo "No existe el contrato $TARGET_SCHEMA_VERSION; último disponible: $latest_version" >&2
  exit 2
}

expected=2
for candidate in changes/V*.sql; do
  [ -e "$candidate" ] || continue
  sequence="$(script_sequence "$candidate")"
  [ "$sequence" -eq "$expected" ] || {
    echo "Se esperaba V$(printf '%03d' "$expected") y apareció $candidate" >&2
    exit 2
  }
  expected=$((expected + 1))
done

action="${1:-reconcile}"
case "$action" in
  reconcile|init|migrate)
    if ! database_exists; then
      echo "SQL Server: inicializando $SQL_DATABASE"
      run_sqlcmd -i "$baseline"
      checksum="$(sha256sum "$baseline" | awk '{print $1}')"
      name="${baseline##*/}"
      record_change 1 "${name%.sql}" "$checksum"
    elif history_exists; then
      verify_or_apply "$baseline"
    elif baseline_complete; then
      echo 'SQL Server: registrando baseline existente sin volver a ejecutarlo'
      checksum="$(sha256sum "$baseline" | awk '{print $1}')"
      name="${baseline##*/}"
      record_change 1 "${name%.sql}" "$checksum"
    elif database_is_empty; then
      echo "SQL Server: inicializando $SQL_DATABASE existente y vacío"
      run_sqlcmd -i "$baseline"
      checksum="$(sha256sum "$baseline" | awk '{print $1}')"
      name="${baseline##*/}"
      record_change 1 "${name%.sql}" "$checksum"
    else
      echo 'SQL Server: base parcial sin historial; se requiere revisión manual' >&2
      exit 4
    fi

    expected=2
    for script in changes/V*.sql; do
      [ -e "$script" ] || continue
      sequence="$(script_sequence "$script")"
      [ "$sequence" -le "$TARGET_SCHEMA_VERSION" ] || continue
      [ "$sequence" -eq "$expected" ] || {
        echo "Se esperaba V$(printf '%03d' "$expected") y apareció $script" >&2
        exit 2
      }
      verify_or_apply "$script"
      expected=$((expected + 1))
    done

    current="$(query_database 'SELECT ISNULL(MAX([sequence]), 0) FROM dbo.schema_changes;')"
    current="$(printf '%s' "$current" | tr -d '[:space:]')"
    [ "$current" -le "$TARGET_SCHEMA_VERSION" ] || {
      echo "La base ya está en V$current; no se permite retroceder a V$TARGET_SCHEMA_VERSION" >&2
      exit 2
    }
    verify_contract
    ;;
  check|verify)
    history_exists || { echo 'SQL Server: no existe historial de cambios' >&2; exit 4; }
    verify_contract
    ;;
  *) echo 'Uso: reconcile | verify' >&2; exit 2 ;;
esac