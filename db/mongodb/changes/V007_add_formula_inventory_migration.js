// Seleccionar la base de datos de la aplicación
db = db.getSiblingDB('AgroTecnoDB');

// =============================================================================
// V007 - Migrar formula_inventory de object a array en la colección formula
// =============================================================================
// CONTEXTO:
//   En V001 (baseline), formula_inventory era un campo de tipo object.
//   En V003, el validador JSON Schema fue actualizado para definirlo como array.
//   Este change-set garantiza que TODOS los documentos existentes tengan
//   formula_inventory como array, evitando errores de validación futuros.
//
// REGLAS DE MIGRACIÓN:
//   - Si es un object (no array) → envolverlo en un array: obj → [obj]
//   - Si es null o no existe    → asignar array vacío: []
//   - Si ya es un array         → no modificar
// =============================================================================

// Verificar que la colección existe antes de operar
const collectionExists = db.getCollectionInfos({ name: 'formula' }).length > 0;
if (!collectionExists) {
  throw Error('La colección formula no existe. Verifique que V001 y V003 fueron ejecutados.');
}

let migratedCount = 0;

// Obtener todos los documentos de formula para inspeccionar formula_inventory
db.formula.find({}).forEach(function(doc) {
  const inv = doc.formula_inventory;

  // Caso 1: El campo no existe o es null → asignar array vacío
  if (inv === null || inv === undefined) {
    db.formula.updateOne(
      { _id: doc._id },
      { $set: { formula_inventory: [] } }
    );
    migratedCount++;
    return;
  }

  // Caso 2: Es un object (no es array) → envolver en array
  if (!Array.isArray(inv) && typeof inv === 'object') {
    db.formula.updateOne(
      { _id: doc._id },
      { $set: { formula_inventory: [inv] } }
    );
    migratedCount++;
    return;
  }

  // Caso 3: Ya es un array → no necesita migración
});

print('V007: Migración de formula_inventory completada. Documentos migrados: ' + migratedCount);
