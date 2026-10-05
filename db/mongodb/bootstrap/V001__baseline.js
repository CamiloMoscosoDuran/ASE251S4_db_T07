// Selects the application database for the remaining initialization scripts.
db = db.getSiblingDB('AgroTecnoDB');

// Creates the collections if they do not exist.

const collections = ['customers', 'supplies', 'formulas', 'field_meetings'];

for (const name of collections) {
  const exists = db.getCollectionInfos({ name }).length > 0;
  if (!exists) {
    db.createCollection(name);
  }
}

// Applies the validation rules to the collections.

db.runCommand({
  collMod: 'customers',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'first_name', 'last_name', 'document_type', 'document_number', 'status', 'registration_date'],
      properties: {
        _id: { bsonType: 'string', pattern: '^CLI[0-9]{3,}$' },
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

db.runCommand({
  collMod: 'supplies',
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

db.runCommand({
  collMod: 'formulas',
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
          bsonType: 'object',
          properties: {
            gallon_type: { bsonType: 'int' },
            stock_quantity: { bsonType: 'int' },
            last_update: { bsonType: 'date' }
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

db.runCommand({
  collMod: 'field_meetings',
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

// Creates the indexes for the collections.

db.customers.createIndex({ document_number: 1 }, { unique: true, name: 'uq_customers_document_number' });
db.customers.createIndex({ email: 1 }, { unique: true, name: 'uq_customers_email' });
db.customers.createIndex({ 'address.department': 1, 'address.province': 1 }, { name: 'ix_customers_location' });

db.supplies.createIndex({ name: 1 }, { name: 'ix_supplies_name' });
db.supplies.createIndex({ status: 1, 'inventory.current_stock': 1 }, { name: 'ix_supplies_stock_status' });
db.supplies.createIndex({ 'inventory.expiration_date': 1 }, { name: 'ix_supplies_expiration' });

db.formulas.createIndex({ name: 1 }, { unique: true, name: 'uq_formulas_name' });
db.formulas.createIndex({ status: 1 }, { name: 'ix_formulas_status' });
db.formulas.createIndex({ 'recipe.ingredients.supply_id': 1 }, { name: 'ix_formulas_supply' });

db.field_meetings.createIndex({ customer_id: 1, meeting_date_time: -1 }, { name: 'ix_meetings_customer_date' });
db.field_meetings.createIndex({ visit_status: 1 }, { name: 'ix_meetings_status' });


// Seeds the collections with initial data.

const ahora = new Date();

const customers = [{
  _id: 'CLI0001',
  first_name: 'Ana',
  last_name: 'Quispe',
  document_type: 'DNI',
  document_number: '70000001',
  phone: ['999111222'],
  email: 'ana.quispe@example.com',
  registration_date: ahora,
  status: true,
  farm_plot: [{
    farm_name: 'Parcela Norte',
    hectareas: NumberDecimal('5.5'),
    type_crop: 'Cafe'
  }],
  address: {
    department: 'Cusco',
    province: 'La Convencion',
    district: 'Quillabamba',
    especifics: {
      settlement_type: 'Comunidad campesina',
      settlement_name: 'Santa Ana',
      street_type: 'Camino',
      street_name: 'Sector Norte',
      reference: 'A 200 metros del mercado'
    }
  },
  created_at: ahora,
  update_at: ahora,
  deleted_at: null,
  restored_at: null
}];

const supplies = [{
  _id: 'SUP0001',
  name: 'Fertilizante organico',
  description: 'Insumo para preparacion agricola',
  inventory: {
    current_stock: Double(100),
    minimum_stock: Double(20),
    expiration_date: new Date('2027-12-31')
  },
  unit: 'kg',
  location: 'Almacen central',
  status: true,
  created_at: ahora,
  update_at: ahora,
  deleted_at: null,
  restored_at: null
}];

const formulas = [{
  _id: 'FOR0001',
  name: 'Formula de cafe organico',
  description: 'Preparacion para un lote de cafe',
  standard_batch: 1,
  unit: 'litros',
  production_time: 60,
  preparation_cost: NumberDecimal('80.00'),
  suggested_price: NumberDecimal('125.00'),
  status: true,
  recipe: {
    version: '1.0',
    ingredients: [{
      supply_id: 'SUP0001',
      supply_name: 'Fertilizante organico',
      quantity_required: NumberDecimal('0.5'),
      percentage: NumberDecimal('100')
    }]
  },
  formula_inventory: {
    gallon_type: 1,
    stock_quantity: 10,
    last_update: ahora
  },
  created_at: ahora,
  update_at: ahora,
  deleted_at: null,
  restored_at: null
}];

const fieldMeetings = [{
  _id: 'MET0001',
  meeting_date_time: ahora,
  customer_id: 'CLI0001',
  farm_name: 'Parcela Norte',
  farm_address: {
    department: 'Cusco',
    province: 'La Convencion',
    district: 'Quillabamba'
  },
  order_sales_id: 'ORD0001',
  fruit_quality: 'Pendiente de evaluacion',
  observation: 'Primera visita de seguimiento.',
  visit_status: 'Pendiente',
  created_at: ahora,
  update_at: ahora,
  deleted_at: null,
  restored_at: null
}];

const seeds = [
  ['customers', customers],
  ['supplies', supplies],
  ['formulas', formulas],
  ['field_meetings', fieldMeetings]
];

for (const [collectionName, docs] of seeds) {
  const collection = db.getCollection(collectionName);
  collection.deleteMany({});
  collection.insertMany(docs);
}