// Seleccionar la base de datos de la aplicacion
db = db.getSiblingDB('AgroTecnoDB');

const ahora = new Date();

// Limpiar datos existentes antes de sembrar
db.customer.deleteMany({});
db.supply.deleteMany({});
db.formula.deleteMany({});
db.field_meeting.deleteMany({});

// =============================================================================
// PARTICIPANTE 3 - V004 extendido
// Cambios respecto a la version original:
//   1. Se agrega el campo obligatorio `category` a los 15 documentos de supply
//      (Fertilizante, Bioestimulante, Micronutriente, Fungicida)
//      para cumplir con el validador estricto de V006.
//   2. order_sales_id convertido de String a Number (1-15) para permitir
//      el indice cruzado con SQL Server definido en V005.
//   3. Los primeros 4 customers cubren las 4 variedades requeridas por V008:
//      'Uva de Mesa', 'Palto Hass', 'Arandano', 'Esparrago'.
//   4. formula_inventory ya era array en V004 original - sin cambios.
// =============================================================================

// --- 15 SUPPLIES (con campo 'category' obligatorio desde V006) ---
const suppliesData = [
  { _id: 'SUP001', name: 'Nitrato de Amonio', description: 'Aporte rapido de nitrogeno para crecimiento foliar', category: 'Fertilizante', inventory: { current_stock: Double(2500.0), minimum_stock: Double(500.0), expiration_date: new Date('2028-06-30') }, unit: 'kg', location: 'Almacen A - Estante 1', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP002', name: 'Sulfato de Potasio', description: 'Mejora la calidad y llenado de frutos', category: 'Fertilizante', inventory: { current_stock: Double(1800.0), minimum_stock: Double(300.0), expiration_date: new Date('2028-12-31') }, unit: 'kg', location: 'Almacen A - Estante 2', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP003', name: 'Sulfato de Magnesio', description: 'Indispensable para la fotosintesis y clorofila', category: 'Fertilizante', inventory: { current_stock: Double(1200.0), minimum_stock: Double(200.0), expiration_date: new Date('2027-10-15') }, unit: 'kg', location: 'Almacen A - Estante 3', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP004', name: 'Fosfato Monopotasico', description: 'Estimulante radicular y floracion alta en fosforo', category: 'Fertilizante', inventory: { current_stock: Double(950.0), minimum_stock: Double(150.0), expiration_date: new Date('2028-01-20') }, unit: 'kg', location: 'Almacen B - Zona Fructificacion', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP005', name: 'Nitrato de Calcio', description: 'Fortalece las paredes celulares en brotes y frutos', category: 'Fertilizante', inventory: { current_stock: Double(3100.0), minimum_stock: Double(600.0), expiration_date: new Date('2029-03-10') }, unit: 'kg', location: 'Almacen A - Estante 4', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP006', name: 'Quelato de Hierro (Fe-EDDHA)', description: 'Corrector de clorosis ferrica en suelos alcalinos', category: 'Micronutriente', inventory: { current_stock: Double(400.0), minimum_stock: Double(80.0), expiration_date: new Date('2027-08-30') }, unit: 'kg', location: 'Almacen Especiales - Estante 1', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP007', name: 'Sulfato de Zinc', description: 'Microelemento clave para la elongacion del tallo', category: 'Micronutriente', inventory: { current_stock: Double(650.0), minimum_stock: Double(100.0), expiration_date: new Date('2028-04-12') }, unit: 'kg', location: 'Almacen B - Microelementos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP008', name: 'Octaborato de Sodio', description: 'Fuente de Boro indispensable para amarre de flor', category: 'Micronutriente', inventory: { current_stock: Double(300.0), minimum_stock: Double(50.0), expiration_date: new Date('2028-11-05') }, unit: 'kg', location: 'Almacen B - Microelementos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP009', name: 'Sulfato de Manganeso', description: 'Participa en el metabolismo del nitrogeno', category: 'Micronutriente', inventory: { current_stock: Double(500.0), minimum_stock: Double(100.0), expiration_date: new Date('2027-11-20') }, unit: 'kg', location: 'Almacen B - Microelementos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP010', name: 'Acido Humico En Polvo', description: 'Mejorador organico de estructura de suelo', category: 'Bioestimulante', inventory: { current_stock: Double(1500.0), minimum_stock: Double(300.0), expiration_date: new Date('2030-01-01') }, unit: 'kg', location: 'Almacen C - Organicos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP011', name: 'Extracto de Algas Marinas', description: 'Bioestimulante rico en fitohormonas naturales', category: 'Bioestimulante', inventory: { current_stock: Double(800.0), minimum_stock: Double(120.0), expiration_date: new Date('2027-05-18') }, unit: 'kg', location: 'Almacen C - Organicos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP012', name: 'Sulfato de Cobre Pentahidratado', description: 'Fungicida nutricional preventivo y corrector', category: 'Fungicida', inventory: { current_stock: Double(720.0), minimum_stock: Double(100.0), expiration_date: new Date('2028-09-14') }, unit: 'kg', location: 'Almacen B - Microelementos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP013', name: 'Molibdato de Sodio', description: 'Optimiza la fijacion biologica del nitrogeno', category: 'Micronutriente', inventory: { current_stock: Double(150.0), minimum_stock: Double(30.0), expiration_date: new Date('2029-02-28') }, unit: 'kg', location: 'Almacen Especiales - Estante 2', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP014', name: 'Aminoacidos Libres', description: 'Antiestresante termico e hidrico para plantas', category: 'Bioestimulante', inventory: { current_stock: Double(1100.0), minimum_stock: Double(200.0), expiration_date: new Date('2027-09-09') }, unit: 'kg', location: 'Almacen C - Organicos', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'SUP015', name: 'Silicato de Potasio', description: 'Inductor de resistencia mecanica y tolerancia a plagas', category: 'Fungicida', inventory: { current_stock: Double(900.0), minimum_stock: Double(150.0), expiration_date: new Date('2028-07-22') }, unit: 'kg', location: 'Almacen A - Estante 5', status: true, created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null }
];

// --- 15 CUSTOMERS ---
// CUS001-CUS004 garantizan las 4 variedades requeridas por el indice multikey de V008:
//   'Uva de Mesa', 'Palto Hass', 'Arandano', 'Esparrago'
const customersData = [
  {
    _id: 'CUS001', first_name: 'Carlos', last_name: 'Mendoza Valdez', document_type: 'DNI', document_number: '45891234',
    phone: ['987654321', '912345678'], email: 'carlos.mendoza@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Fundo El Sol', hectareas: NumberDecimal('12.5'), type_crop: 'Uva de Mesa' }],
    address: { department: 'Ica', province: 'Ica', district: 'Subtanjalla', especifics: { settlement_type: 'Fundo', settlement_name: 'El Sol', street_type: 'Carretera', street_name: 'Panamericana Sur Km 300', reference: 'Frente a grifo Primax' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS002', first_name: 'Maria Elena', last_name: 'Rojas Gutierrez', document_type: 'DNI', document_number: '10234567',
    phone: ['998877665'], email: 'maria.rojas@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Don Maria', hectareas: NumberDecimal('8.0'), type_crop: 'Palto Hass' }],
    address: { department: 'Lima', province: 'Canete', district: 'San Vicente', especifics: { settlement_type: 'Caserio', settlement_name: 'Herbay', street_type: 'Camino', street_name: 'Real S/N', reference: 'A 500m del canal principal' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS003', first_name: 'Jorge Luis', last_name: 'Benitez Campos', document_type: 'RUC', document_number: '10445566771',
    phone: ['955443322', '944332211'], email: 'jorge.benitez@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Parcela San Jose', hectareas: NumberDecimal('15.2'), type_crop: 'Arandano' }],
    address: { department: 'La Libertad', province: 'Trujillo', district: 'Laredo', especifics: { settlement_type: 'Sector', settlement_name: 'Conache', street_type: 'Trocha', street_name: 'Carrozable 3', reference: 'Cerca a la laguna Conache' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS004', first_name: 'Lucia', last_name: 'Alvarez Paredes', document_type: 'DNI', document_number: '71238901',
    phone: ['911223344'], email: 'lucia.alvarez@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Fundo La Esperanza', hectareas: NumberDecimal('20.0'), type_crop: 'Esparrago' }],
    address: { department: 'Ica', province: 'Chincha', district: 'Chincha Baja', especifics: { settlement_type: 'Anexo', settlement_name: 'El Carmen', street_type: 'Calle', street_name: 'Los Cerezos 102', reference: 'Plaza de armas del anexo' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS005', first_name: 'Hernan', last_name: 'Castillo Vega', document_type: 'DNI', document_number: '40987654',
    phone: ['966778899', '933221100'], email: 'hernan.castillo@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Fundo Los Olivos', hectareas: NumberDecimal('5.0'), type_crop: 'Citricos' }],
    address: { department: 'Junin', province: 'Chanchamayo', district: 'San Ramon', especifics: { settlement_type: 'Comunidad', settlement_name: 'Campanilla', street_type: 'Avenida', street_name: 'Los Agronomos 45', reference: 'Desvio a la catarata' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS006', first_name: 'Rosa', last_name: 'Espinoza Palacios', document_type: 'DNI', document_number: '43215678',
    phone: ['922334455'], email: 'rosa.espinoza@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Valle Verde', hectareas: NumberDecimal('10.0'), type_crop: 'Mango Kent' }],
    address: { department: 'Piura', province: 'Sullana', district: 'Querecotillo', especifics: { settlement_type: 'Caserio', settlement_name: 'La Pena', street_type: 'Camino', street_name: 'Vecinal 12', reference: 'Cerca al rio Chira' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS007', first_name: 'Fernando', last_name: 'Guerrero Silva', document_type: 'RUC', document_number: '10789012342',
    phone: ['977889900', '988112233'], email: 'fernando.guerrero@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'El Mirador', hectareas: NumberDecimal('30.0'), type_crop: 'Maiz Amarillo' }],
    address: { department: 'Lambayeque', province: 'Chiclayo', district: 'Monsefu', especifics: { settlement_type: 'Fundo', settlement_name: 'El Mirador', street_type: 'Carretera', street_name: 'A Pimentel Km 5', reference: 'Detras de la subestacion' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS008', first_name: 'Gabriela', last_name: 'Paredes Nunez', document_type: 'DNI', document_number: '73456789',
    phone: ['944556677'], email: 'gabriela.paredes@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Santa Isabel', hectareas: NumberDecimal('6.5'), type_crop: 'Fresa' }],
    address: { department: 'Lima', province: 'Huaral', district: 'Chancay', especifics: { settlement_type: 'Sector', settlement_name: 'Pampa Libre', street_type: 'Pasaje', street_name: 'Las Flores 22', reference: 'Ingreso por el arco' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS009', first_name: 'Victor', last_name: 'Torres Morales', document_type: 'DNI', document_number: '41567890',
    phone: ['912876543', '965432187'], email: 'victor.torres@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Don Victor', hectareas: NumberDecimal('18.0'), type_crop: 'Granada' }],
    address: { department: 'Arequipa', province: 'Arequipa', district: 'La Joya', especifics: { settlement_type: 'Asentamiento', settlement_name: 'San Camilo', street_type: 'Calle', street_name: 'Principal Lote 4', reference: 'Manzana B' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS010', first_name: 'Sofia', last_name: 'Huaman Quispe', document_type: 'DNI', document_number: '72345678',
    phone: ['933445566'], email: 'sofia.huaman@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Fundo El Pedregal', hectareas: NumberDecimal('11.0'), type_crop: 'Palto Fuerte' }],
    address: { department: 'Moquegua', province: 'Mariscal Nieto', district: 'Torata', especifics: { settlement_type: 'Valle', settlement_name: 'Torata Alta', street_type: 'Camino', street_name: 'El Molino S/N', reference: 'Lado del puente' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS011', first_name: 'Diego', last_name: 'Sanchez Flores', document_type: 'DNI', document_number: '46789012',
    phone: ['988990011', '922114455'], email: 'diego.sanchez@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'La Calera', hectareas: NumberDecimal('25.0'), type_crop: 'Mandarina' }],
    address: { department: 'Lima', province: 'Huaral', district: 'Huaral', especifics: { settlement_type: 'Fundo', settlement_name: 'La Calera', street_type: 'Carretera', street_name: 'A Palpa Km 12', reference: 'Puerta blanca con mallas' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS012', first_name: 'Carmen', last_name: 'Vargas Salazar', document_type: 'DNI', document_number: '10987654',
    phone: ['955667788'], email: 'carmen.vargas@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Parcela San Rafael', hectareas: NumberDecimal('7.2'), type_crop: 'Pimiento Nequi' }],
    address: { department: 'Ancash', province: 'Santa', district: 'Chimbote', especifics: { settlement_type: 'Sector', settlement_name: 'Tanggay', street_type: 'Trocha', street_name: 'Principal S/N', reference: 'Sector 2 Parcela 14' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS013', first_name: 'Raul', last_name: 'Delgado Prado', document_type: 'RUC', document_number: '10123456789',
    phone: ['966112233', '977223344'], email: 'raul.delgado@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Los Cerezos', hectareas: NumberDecimal('14.0'), type_crop: 'Cerezos' }],
    address: { department: 'Cajamarca', province: 'Cajamarca', district: 'Banos del Inca', especifics: { settlement_type: 'Caserio', settlement_name: 'Otuzco', street_type: 'Calle', street_name: 'Los Incas 300', reference: 'Cerca a las ventanillas' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS014', first_name: 'Patricia', last_name: 'Arias Camargo', document_type: 'DNI', document_number: '74567890',
    phone: ['911998877'], email: 'patricia.arias@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'Fundo BioAgro', hectareas: NumberDecimal('9.5'), type_crop: 'Kion / Jengibre' }],
    address: { department: 'Junin', province: 'Satipo', district: 'Pangoa', especifics: { settlement_type: 'Sector', settlement_name: 'Chavini', street_type: 'Carretera', street_name: 'Marginal Km 45', reference: 'Entrada al centro poblado' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  },
  {
    _id: 'CUS015', first_name: 'Gustavo', last_name: 'Navarro Rios', document_type: 'DNI', document_number: '48901234',
    phone: ['933887766', '999001122'], email: 'gustavo.navarro@agrotec.com', registration_date: ahora, status: true,
    farm_plot: [{ farm_name: 'El Paraiso', hectareas: NumberDecimal('40.0'), type_crop: 'Cana de Azucar' }],
    address: { department: 'Lambayeque', province: 'Ferrenafe', district: 'Pitipo', especifics: { settlement_type: 'Anexo', settlement_name: 'Batangrande', street_type: 'Camino', street_name: 'El Bosque S/N', reference: 'Al lado del santuario' } },
    created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null
  }
];

// --- 15 FORMULAS ---
// formula_inventory estructurado como array en todos los documentos (V003/V007 compatible)
const formulasData = [
  { _id: 'FOR001', name: 'NutriBio Crecimiento Foliar', description: 'Formula enriquecida en Nitrogeno y Magnesio para fase vegetativa', standard_batch: 100, unit: 'litros', production_time: 45, preparation_cost: NumberDecimal('250.00'), suggested_price: NumberDecimal('420.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP001', supply_name: 'Nitrato de Amonio', quantity_required: NumberDecimal('50.0'), percentage: NumberDecimal('50.00') }, { supply_id: 'SUP003', supply_name: 'Sulfato de Magnesio', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }, { supply_id: 'SUP014', supply_name: 'Aminoacidos Libres', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 80, last_update: ahora }, { gallon_type: 20, stock_quantity: 15, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR002', name: 'K-Max Fructificacion Superior', description: 'Formula de alto potasio para cuajado y aumento de calibre', standard_batch: 100, unit: 'litros', production_time: 60, preparation_cost: NumberDecimal('380.00'), suggested_price: NumberDecimal('600.00'), status: true, recipe: { version: '1.1', ingredients: [{ supply_id: 'SUP002', supply_name: 'Sulfato de Potasio', quantity_required: NumberDecimal('60.0'), percentage: NumberDecimal('60.00') }, { supply_id: 'SUP004', supply_name: 'Fosfato Monopotasico', quantity_required: NumberDecimal('25.0'), percentage: NumberDecimal('25.00') }, { supply_id: 'SUP008', supply_name: 'Octaborato de Sodio', quantity_required: NumberDecimal('15.0'), percentage: NumberDecimal('15.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 120, last_update: ahora }, { gallon_type: 20, stock_quantity: 25, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR003', name: 'Calcio-Boro Estructural', description: 'Prevencion de bitter pit y fortalece la floracion', standard_batch: 100, unit: 'litros', production_time: 30, preparation_cost: NumberDecimal('290.00'), suggested_price: NumberDecimal('480.00'), status: true, recipe: { version: '2.0', ingredients: [{ supply_id: 'SUP005', supply_name: 'Nitrato de Calcio', quantity_required: NumberDecimal('70.0'), percentage: NumberDecimal('70.00') }, { supply_id: 'SUP008', supply_name: 'Octaborato de Sodio', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }, { supply_id: 'SUP014', supply_name: 'Aminoacidos Libres', quantity_required: NumberDecimal('10.0'), percentage: NumberDecimal('10.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 50, last_update: ahora }, { gallon_type: 20, stock_quantity: 10, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR004', name: 'Bio-Root Enraizante Potente', description: 'Desarrollo radicular vigoroso para trasplantes', standard_batch: 100, unit: 'litros', production_time: 40, preparation_cost: NumberDecimal('310.00'), suggested_price: NumberDecimal('510.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP004', supply_name: 'Fosfato Monopotasico', quantity_required: NumberDecimal('40.0'), percentage: NumberDecimal('40.00') }, { supply_id: 'SUP010', supply_name: 'Acido Humico En Polvo', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP011', supply_name: 'Extracto de Algas Marinas', quantity_required: NumberDecimal('25.0'), percentage: NumberDecimal('25.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 95, last_update: ahora }, { gallon_type: 20, stock_quantity: 18, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR005', name: 'MicroMix Completo Folio', description: 'Corrector integral de micronutrientes esenciales', standard_batch: 100, unit: 'litros', production_time: 50, preparation_cost: NumberDecimal('410.00'), suggested_price: NumberDecimal('680.00'), status: true, recipe: { version: '2.1', ingredients: [{ supply_id: 'SUP006', supply_name: 'Quelato de Hierro (Fe-EDDHA)', quantity_required: NumberDecimal('40.0'), percentage: NumberDecimal('40.00') }, { supply_id: 'SUP007', supply_name: 'Sulfato de Zinc', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }, { supply_id: 'SUP009', supply_name: 'Sulfato de Manganeso', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 40, last_update: ahora }, { gallon_type: 20, stock_quantity: 8, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR006', name: 'Anti-Stress BioActivator', description: 'Recuperador de plantas ante heladas o sequias', standard_batch: 100, unit: 'litros', production_time: 35, preparation_cost: NumberDecimal('340.00'), suggested_price: NumberDecimal('560.00'), status: true, recipe: { version: '1.2', ingredients: [{ supply_id: 'SUP014', supply_name: 'Aminoacidos Libres', quantity_required: NumberDecimal('50.0'), percentage: NumberDecimal('50.00') }, { supply_id: 'SUP011', supply_name: 'Extracto de Algas Marinas', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }, { supply_id: 'SUP003', supply_name: 'Sulfato de Magnesio', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 110, last_update: ahora }, { gallon_type: 20, stock_quantity: 22, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR007', name: 'SueloSano Humico Plus', description: 'Mejorador de la Capacidad de Intercambio Cationico (CIC)', standard_batch: 100, unit: 'litros', production_time: 40, preparation_cost: NumberDecimal('180.00'), suggested_price: NumberDecimal('320.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP010', supply_name: 'Acido Humico En Polvo', quantity_required: NumberDecimal('60.0'), percentage: NumberDecimal('60.00') }, { supply_id: 'SUP003', supply_name: 'Sulfato de Magnesio', quantity_required: NumberDecimal('25.0'), percentage: NumberDecimal('25.00') }, { supply_id: 'SUP015', supply_name: 'Silicato de Potasio', quantity_required: NumberDecimal('15.0'), percentage: NumberDecimal('15.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 65, last_update: ahora }, { gallon_type: 20, stock_quantity: 12, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR008', name: 'Shield-K Silicio Protector', description: 'Refuerza la cuticula para prevenir hongos foliares', standard_batch: 100, unit: 'litros', production_time: 45, preparation_cost: NumberDecimal('260.00'), suggested_price: NumberDecimal('440.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP015', supply_name: 'Silicato de Potasio', quantity_required: NumberDecimal('55.0'), percentage: NumberDecimal('55.00') }, { supply_id: 'SUP012', supply_name: 'Sulfato de Cobre Pentahidratado', quantity_required: NumberDecimal('25.0'), percentage: NumberDecimal('25.00') }, { supply_id: 'SUP007', supply_name: 'Sulfato de Zinc', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 75, last_update: ahora }, { gallon_type: 20, stock_quantity: 14, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR009', name: 'VerdeCloro Hierro y Zinc', description: 'Acelerador de fotosintesis y sintesis de auxinas', standard_batch: 100, unit: 'litros', production_time: 30, preparation_cost: NumberDecimal('330.00'), suggested_price: NumberDecimal('520.00'), status: true, recipe: { version: '2.0', ingredients: [{ supply_id: 'SUP006', supply_name: 'Quelato de Hierro (Fe-EDDHA)', quantity_required: NumberDecimal('45.0'), percentage: NumberDecimal('45.00') }, { supply_id: 'SUP007', supply_name: 'Sulfato de Zinc', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP001', supply_name: 'Nitrato de Amonio', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 85, last_update: ahora }, { gallon_type: 20, stock_quantity: 16, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR010', name: 'CobreBio Preventivo Fungoso', description: 'Aporte de cobre con aminoacidos de facil absorcion', standard_batch: 100, unit: 'litros', production_time: 40, preparation_cost: NumberDecimal('220.00'), suggested_price: NumberDecimal('390.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP012', supply_name: 'Sulfato de Cobre Pentahidratado', quantity_required: NumberDecimal('50.0'), percentage: NumberDecimal('50.00') }, { supply_id: 'SUP014', supply_name: 'Aminoacidos Libres', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }, { supply_id: 'SUP009', supply_name: 'Sulfato de Manganeso', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 90, last_update: ahora }, { gallon_type: 20, stock_quantity: 20, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR011', name: 'N-K Balance Maduracion', description: 'Equilibrio optimo para etapas previas a la cosecha', standard_batch: 100, unit: 'litros', production_time: 55, preparation_cost: NumberDecimal('360.00'), suggested_price: NumberDecimal('580.00'), status: true, recipe: { version: '1.3', ingredients: [{ supply_id: 'SUP002', supply_name: 'Sulfato de Potasio', quantity_required: NumberDecimal('50.0'), percentage: NumberDecimal('50.00') }, { supply_id: 'SUP001', supply_name: 'Nitrato de Amonio', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }, { supply_id: 'SUP003', supply_name: 'Sulfato de Magnesio', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 100, last_update: ahora }, { gallon_type: 20, stock_quantity: 19, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR012', name: 'LegumFix Molibdeno-Boro', description: 'Especial para leguminosas e induccion floral', standard_batch: 100, unit: 'litros', production_time: 35, preparation_cost: NumberDecimal('450.00'), suggested_price: NumberDecimal('720.00'), status: true, recipe: { version: '2.0', ingredients: [{ supply_id: 'SUP013', supply_name: 'Molibdato de Sodio', quantity_required: NumberDecimal('40.0'), percentage: NumberDecimal('40.00') }, { supply_id: 'SUP008', supply_name: 'Octaborato de Sodio', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP011', supply_name: 'Extracto de Algas Marinas', quantity_required: NumberDecimal('25.0'), percentage: NumberDecimal('25.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 30, last_update: ahora }, { gallon_type: 20, stock_quantity: 5, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR013', name: 'MagnesioPlus Fotosintesis', description: 'Dosis alta de Magnesio para evitar deficiencias foliares', standard_batch: 100, unit: 'litros', production_time: 30, preparation_cost: NumberDecimal('210.00'), suggested_price: NumberDecimal('350.00'), status: true, recipe: { version: '1.0', ingredients: [{ supply_id: 'SUP003', supply_name: 'Sulfato de Magnesio', quantity_required: NumberDecimal('65.0'), percentage: NumberDecimal('65.00') }, { supply_id: 'SUP001', supply_name: 'Nitrato de Amonio', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }, { supply_id: 'SUP007', supply_name: 'Sulfato de Zinc', quantity_required: NumberDecimal('15.0'), percentage: NumberDecimal('15.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 70, last_update: ahora }, { gallon_type: 20, stock_quantity: 11, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR014', name: 'FlorMax Boro-Zinc', description: 'Potenciador de la fertilidad del polen y cuajado', standard_batch: 100, unit: 'litros', production_time: 40, preparation_cost: NumberDecimal('280.00'), suggested_price: NumberDecimal('460.00'), status: true, recipe: { version: '1.1', ingredients: [{ supply_id: 'SUP008', supply_name: 'Octaborato de Sodio', quantity_required: NumberDecimal('45.0'), percentage: NumberDecimal('45.00') }, { supply_id: 'SUP007', supply_name: 'Sulfato de Zinc', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP014', supply_name: 'Aminoacidos Libres', quantity_required: NumberDecimal('20.0'), percentage: NumberDecimal('20.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 88, last_update: ahora }, { gallon_type: 20, stock_quantity: 17, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'FOR015', name: 'TotalGrip Nutricion Balanceada', description: 'Formula completa NPK + Microelementos para mantenimiento', standard_batch: 100, unit: 'litros', production_time: 60, preparation_cost: NumberDecimal('400.00'), suggested_price: NumberDecimal('650.00'), status: true, recipe: { version: '3.0', ingredients: [{ supply_id: 'SUP001', supply_name: 'Nitrato de Amonio', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP002', supply_name: 'Sulfato de Potasio', quantity_required: NumberDecimal('35.0'), percentage: NumberDecimal('35.00') }, { supply_id: 'SUP004', supply_name: 'Fosfato Monopotasico', quantity_required: NumberDecimal('30.0'), percentage: NumberDecimal('30.00') }]}, formula_inventory: [{ gallon_type: 1, stock_quantity: 150, last_update: ahora }, { gallon_type: 20, stock_quantity: 30, last_update: ahora }], created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null }
];

// --- 15 FIELD MEETINGS ---
// order_sales_id como String ('ORD0001'-'ORD0015') requerido por el validador de V003
// e indexado por ix_field_meeting_order_sales_id (V005)
const fieldMeetingsData = [
  { _id: 'MET001', meeting_date_time: new Date('2026-10-01T09:00:00Z'), customer_id: 'CUS001', farm_name: 'Fundo El Sol', farm_address: { department: 'Ica', province: 'Ica', district: 'Subtanjalla' }, order_sales_id: 'ORD0001', fruit_quality: 'Brix 14 - Bueno', observation: 'Primera visita post-aplicacion de NutriBio Crecimiento.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET002', meeting_date_time: new Date('2026-10-02T10:30:00Z'), customer_id: 'CUS001', farm_name: 'Fundo El Sol', farm_address: { department: 'Ica', province: 'Ica', district: 'Subtanjalla' }, order_sales_id: 'ORD0002', fruit_quality: 'Brix 16 - Muy Bueno', observation: 'Seguimiento de cuajado, excelente respuesta al potasio.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET003', meeting_date_time: new Date('2026-10-03T11:00:00Z'), customer_id: 'CUS001', farm_name: 'Fundo El Sol', farm_address: { department: 'Ica', province: 'Ica', district: 'Subtanjalla' }, order_sales_id: 'ORD0003', fruit_quality: 'Pendiente de evaluacion', observation: 'Visita tecnica para programar precosecha.', visit_status: 'Pendiente', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET004', meeting_date_time: new Date('2026-10-04T08:30:00Z'), customer_id: 'CUS002', farm_name: 'Don Maria', farm_address: { department: 'Lima', province: 'Canete', district: 'San Vicente' }, order_sales_id: 'ORD0004', fruit_quality: 'Calibre 18 - Estandar', observation: 'Evaluacion de brotacion en Palto Hass.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET005', meeting_date_time: new Date('2026-10-05T09:00:00Z'), customer_id: 'CUS002', farm_name: 'Don Maria', farm_address: { department: 'Lima', province: 'Canete', district: 'San Vicente' }, order_sales_id: 'ORD0005', fruit_quality: 'Calibre 22 - Optimo', observation: 'Segunda inspeccion radicular con Bio-Root.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET006', meeting_date_time: new Date('2026-10-06T14:00:00Z'), customer_id: 'CUS003', farm_name: 'Parcela San Jose', farm_address: { department: 'La Libertad', province: 'Trujillo', district: 'Laredo' }, order_sales_id: 'ORD0006', fruit_quality: 'Firmeza 85 - Alta', observation: 'Control de amarre de flor en Arandanos.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET007', meeting_date_time: new Date('2026-10-07T15:30:00Z'), customer_id: 'CUS003', farm_name: 'Parcela San Jose', farm_address: { department: 'La Libertad', province: 'Trujillo', district: 'Laredo' }, order_sales_id: 'ORD0007', fruit_quality: 'Firmeza 90 - Excelente', observation: 'Inspeccion de manchas foliares resueltas.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET008', meeting_date_time: new Date('2026-10-08T10:00:00Z'), customer_id: 'CUS004', farm_name: 'Fundo La Esperanza', farm_address: { department: 'Ica', province: 'Chincha', district: 'Chincha Baja' }, order_sales_id: 'ORD0008', fruit_quality: 'Turgescencia A1', observation: 'Reunion pospuesta por problemas de riego del cliente.', visit_status: 'Pospuesta', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET009', meeting_date_time: new Date('2026-10-09T11:30:00Z'), customer_id: 'CUS005', farm_name: 'Fundo Los Olivos', farm_address: { department: 'Junin', province: 'Chanchamayo', district: 'San Ramon' }, order_sales_id: 'ORD0009', fruit_quality: 'Jugo 42% - Aceptable', observation: 'Muestra de hojas para analisis de microelementos.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET010', meeting_date_time: new Date('2026-10-10T08:00:00Z'), customer_id: 'CUS005', farm_name: 'Fundo Los Olivos', farm_address: { department: 'Junin', province: 'Chanchamayo', district: 'San Ramon' }, order_sales_id: 'ORD0010', fruit_quality: 'Jugo 48% - Optimo', observation: 'Evaluacion post-aplicacion MicroMix.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET011', meeting_date_time: new Date('2026-10-11T12:00:00Z'), customer_id: 'CUS006', farm_name: 'Valle Verde', farm_address: { department: 'Piura', province: 'Sullana', district: 'Querecotillo' }, order_sales_id: 'ORD0011', fruit_quality: 'Chapa roja 30% - Inicial', observation: 'Monitoreo de floracion en Mango Kent.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET012', meeting_date_time: new Date('2026-10-12T09:30:00Z'), customer_id: 'CUS007', farm_name: 'El Mirador', farm_address: { department: 'Lambayeque', province: 'Chiclayo', district: 'Monsefu' }, order_sales_id: 'ORD0012', fruit_quality: 'Grano Duro - Bueno', observation: 'Evaluacion del verdor foliar con Nitrato de Amonio.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET013', meeting_date_time: new Date('2026-10-13T16:00:00Z'), customer_id: 'CUS008', farm_name: 'Santa Isabel', farm_address: { department: 'Lima', province: 'Huaral', district: 'Chancay' }, order_sales_id: 'ORD0013', fruit_quality: 'Grado Brix 10 - Regular', observation: 'Verificacion de dureza en fruta.', visit_status: 'Pendiente', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET014', meeting_date_time: new Date('2026-10-14T10:00:00Z'), customer_id: 'CUS009', farm_name: 'Don Victor', farm_address: { department: 'Arequipa', province: 'Arequipa', district: 'La Joya' }, order_sales_id: 'ORD0014', fruit_quality: 'Color Arilo Rojo Intenso', observation: 'Reunion cancelada a solicitud del productor.', visit_status: 'Cancelada', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null },
  { _id: 'MET015', meeting_date_time: new Date('2026-10-15T11:00:00Z'), customer_id: 'CUS010', farm_name: 'Fundo El Pedregal', farm_address: { department: 'Moquegua', province: 'Mariscal Nieto', district: 'Torata' }, order_sales_id: 'ORD0015', fruit_quality: 'Calibre 20 - Bueno', observation: 'Revision final de plan nutricional.', visit_status: 'Completa', created_at: ahora, update_at: ahora, deleted_at: null, restored_at: null }
];

// Carga en lote de las 4 colecciones
db.customer.insertMany(customersData);
db.supply.insertMany(suppliesData);
db.formula.insertMany(formulasData);
db.field_meeting.insertMany(fieldMeetingsData);

print('Insercion exitosa: 15 documentos insertados en cada una de las 4 colecciones.');
print('  -> supply   : todos incluyen campo obligatorio "category" (Fertilizante/Bioestimulante/Micronutriente/Fungicida).');
print('  -> field_meeting: order_sales_id como String ORD0001-ORD0015 para indice cruzado V005.');
print('  -> customer : Uva de Mesa / Palto Hass / Arandano / Esparrago cubiertos para indice multikey V008.');
print('  -> formula  : formula_inventory como array en todos los documentos (V003/V007).');
