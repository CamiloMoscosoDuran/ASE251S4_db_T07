// Seleccionar la base de datos de la aplicación
db = db.getSiblingDB('AgroTecnoDB');

// =============================================================================
// V006 - Agregar campo 'category' al validador y datos de la colección supply
// =============================================================================
// CONTEXTO:
//   Se incorpora el campo 'category' para clasificar insumos (ej: Fertilizante,
//   Pesticida, Fungicida). El campo es requerido a partir de esta versión.
//   Los documentos existentes sin 'category' reciben el valor por defecto 'General'.
// =============================================================================

// Verificar que la colección existe antes de operar
const collectionExists = db.getCollectionInfos({ name: 'supply' }).length > 0;
if (!collectionExists) {
  throw Error('La colección supply no existe. Verifique que V001 y V003 fueron ejecutados.');
}

// 1. ACTUALIZAR VALIDADOR JSON SCHEMA DE supply
//    Se agrega 'category' a required y a properties, manteniendo el esquema
//    existente de V003 sin modificar los demás campos.
db.runCommand({
  collMod: 'supply',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'category', 'inventory', 'unit', 'location', 'status'],
      properties: {
        _id: { bsonType: 'string', pattern: '^SUP[0-9]{3,}$' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        category: { bsonType: 'string' },
        inventory: {
          bsonType: 'object',
          required: ['current_stock', 'minimum_stock', 'expiration_date'],
          properties: {
            current_stock: { bsonType: 'double' },
            minimum_stock: { bsonType: 'double' },
            expiration_date: { bsonType: 'date' }
          }
        },
        unit: { bsonType: 'string' },
        location: { bsonType: 'string' },
        status: { bsonType: 'bool' },
        created_at: { bsonType: 'date' },
        update_at: { bsonType: ['date', 'null'] },
        deleted_at: { bsonType: ['date', 'null'] },
        restored_at: { bsonType: ['date', 'null'] }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

// 2. MIGRAR DOCUMENTOS EXISTENTES SIN 'category'
//    El validador se aplica en modo bypassDocumentValidation para poder
//    actualizar los documentos que aún incumplen el nuevo esquema.
const migrateResult = db.supply.updateMany(
  { category: { $exists: false } },
  { $set: { category: 'General' } }
);
print('V006: Documentos de supply actualizados con category="General": ' + migrateResult.modifiedCount);

// 3. CREAR ÍNDICE SOBRE category
db.supply.createIndex(
  { category: 1 },
  { name: 'ix_supply_category' }
);

print('V006: Validador actualizado e índice ix_supply_category creado correctamente en la colección supply.');
