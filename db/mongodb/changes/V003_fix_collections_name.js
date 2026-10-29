// Seleccionar la base de datos de la aplicación
db = db.getSiblingDB('AgroTecnoDB');

// 1. RENOMBRAR COLECCIONES SIN PERDER DOCUMENTOS
const newCollections = ['customer', 'supply', 'formula', 'field_meeting'];
const collectionRenames = [
  ['customers', 'customer'],
  ['supplies', 'supply'],
  ['formulas', 'formula'],
  ['field_meetings', 'field_meeting']
];

for (const [oldName, newName] of collectionRenames) {
  const oldExists = db.getCollectionInfos({ name: oldName }).length > 0;
  const newExists = db.getCollectionInfos({ name: newName }).length > 0;
  if (oldExists && newExists) {
    throw Error('Existen ambas colecciones ' + oldName + ' y ' + newName);
  }
  if (oldExists) {
    db.getCollection(oldName).renameCollection(newName);
  } else if (!newExists) {
    throw Error('No existe la colección ' + oldName + ' ni ' + newName);
  }
}

// 2. APLICAR VALIDACIONES SCHEMA JSON A CADA COLECCIÓN

// --- COLLECTION: customer ---
db.runCommand({
  collMod: 'customer',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'first_name', 'last_name', 'document_type', 'document_number', 'status', 'registration_date'],
      properties: {
        _id: { bsonType: 'string', pattern: '^CUS[0-9]{3,}$' },
        first_name: { bsonType: 'string' },
        last_name: { bsonType: 'string' },
        document_type: { bsonType: 'string' },
        document_number: { bsonType: 'string' },
        phone: { bsonType: 'array', items: { bsonType: 'string' } },
        email: { bsonType: 'string', minLength: 3, maxLength: 200 },
        registration_date: { bsonType: 'date' },
        status: { bsonType: 'bool' },
        farm_plot: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              farm_name: { bsonType: 'string' },
              hectareas: { bsonType: ['decimal', 'double', 'int', 'long'], minimum: 0 },
              type_crop: { bsonType: 'string' }
            }
          }
        },
        address: {
          bsonType: 'object',
          properties: {
            department: { bsonType: 'string' },
            province: { bsonType: 'string' },
            district: { bsonType: 'string' },
            especifics: {
              bsonType: 'object',
              properties: {
                settlement_type: { bsonType: 'string' },
                settlement_name: { bsonType: 'string' },
                street_type: { bsonType: 'string' },
                street_name: { bsonType: 'string' },
                reference: { bsonType: 'string' }
              }
            }
          }
        },
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

// --- COLLECTION: supply ---
db.runCommand({
  collMod: 'supply',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'inventory', 'unit', 'location', 'status'],
      properties: {
        _id: { bsonType: 'string', pattern: '^SUP[0-9]{3,}$' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
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

// --- COLLECTION: formula ---
db.runCommand({
  collMod: 'formula',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'standard_batch', 'unit', 'status', 'recipe'],
      properties: {
        _id: { bsonType: 'string', pattern: '^FOR[0-9]{3,}$' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        standard_batch: { bsonType: 'int' },
        unit: { bsonType: 'string' },
        production_time: { bsonType: 'int' },
        preparation_cost: { bsonType: 'decimal' },
        suggested_price: { bsonType: 'decimal' },
        status: { bsonType: 'bool' },
        recipe: {
          bsonType: 'object',
          required: ['version', 'ingredients'],
          properties: {
            version: { bsonType: 'string' },
            ingredients: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['supply_id', 'supply_name', 'quantity_required', 'percentage'],
                properties: {
                  supply_id: { bsonType: 'string' },
                  supply_name: { bsonType: 'string' },
                  quantity_required: { bsonType: 'decimal' },
                  percentage: { bsonType: 'decimal' }
                }
              }
            }
          }
        },
        formula_inventory: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              gallon_type: { bsonType: 'int' },
              stock_quantity: { bsonType: 'int' },
              last_update: { bsonType: 'date' }
            }
          }
        },
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

// --- COLLECTION: field_meeting ---
db.runCommand({
  collMod: 'field_meeting',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'meeting_date_time', 'customer_id', 'farm_name', 'farm_address', 'order_sales_id', 'visit_status'],
      properties: {
        _id: { bsonType: 'string', pattern: '^MET[0-9]{3,}$' },
        meeting_date_time: { bsonType: 'date' },
        customer_id: { bsonType: 'string' },
        farm_name: { bsonType: 'string' },
        farm_address: { bsonType: 'object' },
        order_sales_id: { bsonType: 'string' },
        fruit_quality: { bsonType: 'string' },
        observation: { bsonType: 'string' },
        visit_status: { enum: ['Pendiente', 'Completa', 'Pospuesta', 'Cancelada'] },
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

// 3. CREACIÓN DE ÍNDICES
for (const name of newCollections) {
  const collection = db.getCollection(name);
  for (const index of collection.getIndexes()) {
    if (index.name !== '_id_') {
      collection.dropIndex(index.name);
    }
  }
}

db.customer.createIndex({ document_number: 1 }, { unique: true, name: 'uq_customer_document_number' });
db.customer.createIndex({ email: 1 }, { unique: true, name: 'uq_customer_email' });
db.customer.createIndex({ 'address.department': 1, 'address.province': 1 }, { name: 'ix_customer_location' });

db.supply.createIndex({ name: 1 }, { name: 'ix_supply_name' });
db.supply.createIndex({ status: 1, 'inventory.current_stock': 1 }, { name: 'ix_supply_stock_status' });
db.supply.createIndex({ 'inventory.expiration_date': 1 }, { name: 'ix_supply_expiration' });

db.formula.createIndex({ name: 1 }, { unique: true, name: 'uq_formula_name' });
db.formula.createIndex({ status: 1 }, { name: 'ix_formula_status' });
db.formula.createIndex({ 'recipe.ingredients.supply_id': 1 }, { name: 'ix_formula_supply' });

db.field_meeting.createIndex({ customer_id: 1, meeting_date_time: -1 }, { name: 'ix_meeting_customer_date' });
db.field_meeting.createIndex({ visit_status: 1 }, { name: 'ix_meeting_status' });

print("Estructuras, esquemas e índices creados correctamente para customer, supply, formula y field_meeting.");