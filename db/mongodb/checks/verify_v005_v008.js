// =============================================================================
// verify_v005_v008.js  -  Script de verificacion integral AgroTecnoDB
// Participante 3 - ASE251S4_db_T07
// Ejecutar con:
//   mongosh "mongodb://admin:admin_password@localhost:27017/AgroTecnoDB?authSource=admin" \
//           db/mongodb/checks/verify_v005_v008.js
// =============================================================================
// Cubre 4 areas de prueba:
//   1. Existencia de los 4 indices de V005 y V008
//   2. Rechazo del validador estricto de V006 (sin campo 'category')
//   3. Consistencia: 100% de formulas con formula_inventory como array (V007)
//   4. Contrato de colecciones: minimo 15 documentos por coleccion
// =============================================================================

db = db.getSiblingDB('AgroTecnoDB');

let passed = 0;
let failed = 0;
const SEPARATOR = '='.repeat(65);

function ok(msg) {
  print('  [OK] ' + msg);
  passed++;
}

function fail(msg) {
  print('  [FAIL] ' + msg);
  failed++;
}

function section(title) {
  print('');
  print(SEPARATOR);
  print('  ' + title);
  print(SEPARATOR);
}

// =============================================================================
// 1. VERIFICACION DE INDICES (V005 y V008)
// =============================================================================
section('1. INDICES - V005 (field_meeting) y V008 (customer)');

// Helper: busca un indice por nombre en una coleccion
function indexExists(collName, indexName) {
  const indexes = db.getCollection(collName).getIndexes();
  return indexes.some(function(idx) { return idx.name === indexName; });
}

// V005: ix_field_meeting_order_sales_id en field_meeting
if (indexExists('field_meeting', 'ix_field_meeting_order_sales_id')) {
  ok('ix_field_meeting_order_sales_id existe en field_meeting');
} else {
  fail('ix_field_meeting_order_sales_id NO encontrado en field_meeting (requiere V005)');
}

// V006: ix_supply_category en supply
if (indexExists('supply', 'ix_supply_category')) {
  ok('ix_supply_category existe en supply');
} else {
  fail('ix_supply_category NO encontrado en supply (requiere V006)');
}

// V008: ix_customer_type_crop en customer (multikey)
if (indexExists('customer', 'ix_customer_type_crop')) {
  ok('ix_customer_type_crop existe en customer (multikey sobre farm_plot.type_crop)');
} else {
  fail('ix_customer_type_crop NO encontrado en customer (requiere V008)');
}

// V008: ix_customer_status_registration en customer (compuesto)
if (indexExists('customer', 'ix_customer_status_registration')) {
  ok('ix_customer_status_registration existe en customer (compuesto status + registration_date)');
} else {
  fail('ix_customer_status_registration NO encontrado en customer (requiere V008)');
}

// =============================================================================
// 2. VALIDADOR ESTRICTO DE SUPPLY (V006) - debe rechazar documento sin 'category'
// =============================================================================
section('2. VALIDADOR ESTRICTO - supply sin campo category debe ser rechazado (V006)');

let validatorWorks = false;
try {
  db.supply.insertOne({
    _id: 'SUP_TEST_INVALID',
    name: 'Insumo Sin Categoria',
    // 'category' omitido intencionalmente para forzar el rechazo del validador
    inventory: {
      current_stock: Double(100.0),
      minimum_stock: Double(10.0),
      expiration_date: new Date('2027-01-01')
    },
    unit: 'kg',
    location: 'Almacen Test',
    status: true
  });
  // Si llego aqui, el validador NO rechazo la insercion - FALLO
  fail('El validador NO rechazo la insercion sin category (validationLevel no es strict)');
  // Limpiar el documento de prueba que no debia existir
  db.supply.deleteOne({ _id: 'SUP_TEST_INVALID' });
} catch (e) {
  if (e.message && (e.message.includes('Document failed validation') || e.message.includes('failed validation') || e.codeName === 'DocumentValidationFailure' || e.code === 121)) {
    ok('Validador rechaza correctamente supply sin "category" → ' + e.message.split('\n')[0]);
    validatorWorks = true;
  } else {
    fail('Error inesperado al probar el validador: ' + e.message);
  }
}

// =============================================================================
// 3. CONSISTENCIA DE DATOS - formula_inventory debe ser array (V007)
// =============================================================================
section('3. CONSISTENCIA - formula_inventory como array en 100% de documentos (V007)');

const totalFormulas = db.formula.countDocuments({});
const formulasConArray = db.formula.countDocuments({ formula_inventory: { $type: 'array' } });
const formulasSinArray = totalFormulas - formulasConArray;

print('  Total de documentos en formula   : ' + totalFormulas);
print('  Con formula_inventory como array  : ' + formulasConArray);
print('  Sin formula_inventory como array  : ' + formulasSinArray);

if (totalFormulas > 0 && formulasSinArray === 0) {
  ok('100% de documentos en formula tienen formula_inventory de tipo array (' + formulasConArray + '/' + totalFormulas + ')');
} else if (totalFormulas === 0) {
  fail('La coleccion formula esta vacia - verifique que V004 fue ejecutado');
} else {
  fail(formulasSinArray + ' documento(s) en formula NO tienen formula_inventory como array (requiere V007)');
}

// =============================================================================
// 4. CONTRATO DE COLECCIONES - minimo 15 documentos en cada coleccion (V004)
// =============================================================================
section('4. CONTRATO DE COLECCIONES - minimo 15 registros por coleccion (V004)');

const MIN_DOCS = 15;
const colecciones = ['customer', 'supply', 'formula', 'field_meeting'];

colecciones.forEach(function(col) {
  const count = db.getCollection(col).countDocuments({});
  if (count >= MIN_DOCS) {
    ok(col + ' → ' + count + ' documentos (>= ' + MIN_DOCS + ')');
  } else {
    fail(col + ' → solo ' + count + ' documento(s) - se requieren minimo ' + MIN_DOCS);
  }
});

// =============================================================================
// BONUS: Verificar que los 4 type_crop requeridos estan presentes en customer
// =============================================================================
section('5. BONUS - Variedades de cultivo para indice multikey V008');

const requiredCrops = ['Uva de Mesa', 'Palto Hass', 'Arandano', 'Esparrago'];
requiredCrops.forEach(function(crop) {
  const count = db.customer.countDocuments({ 'farm_plot.type_crop': crop });
  if (count > 0) {
    ok('type_crop "' + crop + '" presente en ' + count + ' cliente(s)');
  } else {
    fail('type_crop "' + crop + '" NO encontrado en ninguna parcela de customer');
  }
});

// Verificar order_sales_id en field_meeting (consistente con V003 schema y V005 index)
const meetingsConOrder = db.field_meeting.countDocuments({ order_sales_id: { $type: 'string', $regex: /^ORD/ } });
const totalMeetings = db.field_meeting.countDocuments({});
if (meetingsConOrder === totalMeetings && totalMeetings > 0) {
  ok('order_sales_id es de tipo String ("ORDxxxx") en los ' + meetingsConOrder + ' documentos de field_meeting');
} else {
  fail('order_sales_id no es String válido en todos los documentos: ' + meetingsConOrder + '/' + totalMeetings);
}

// =============================================================================
// RESUMEN FINAL
// =============================================================================
print('');
print(SEPARATOR);
print('  RESUMEN DE VERIFICACION - AgroTecnoDB V005-V008');
print(SEPARATOR);
print('  Pruebas pasadas : ' + passed);
print('  Pruebas fallidas: ' + failed);
print('  Total de pruebas: ' + (passed + failed));
print(SEPARATOR);

if (failed === 0) {
  print('  RESULTADO: TODAS LAS VERIFICACIONES PASARON CORRECTAMENTE');
  print('  La base de datos AgroTecnoDB cumple el contrato V005-V008.');
} else {
  print('  RESULTADO: ' + failed + ' VERIFICACION(ES) FALLARON');
  print('  Revise los cambios marcados con [FAIL] y corrija antes de hacer merge.');
  quit(1);
}
print(SEPARATOR);
