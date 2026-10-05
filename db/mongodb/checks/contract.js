var adminDb = db.getSiblingDB('admin');
if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
  throw Error('No se pudo autenticar el administrador MongoDB');
}

var labDb = db.getSiblingDB(process.env.MONGO_DATABASE);
var requested = Number(process.env.TARGET_SCHEMA_VERSION);
var changes = labDb.schema_changes.find().sort({sequence: 1}).toArray();

if (changes.length !== requested || changes[changes.length - 1].sequence !== requested) {
  throw Error('Historial de cambios incompatible con la versión solicitada');
}
for (var sequence = 1; sequence <= requested; sequence++) {
  if (changes[sequence - 1].sequence !== sequence) {
    throw Error('Falta la secuencia ' + sequence);
  }
}

var customerInfo = labDb.getCollectionInfos({name: 'customers'})[0];
var expectedPrefix = requested >= 2 ? 'CUS' : 'CLI';
var expectedId = requested >= 2 ? 'CUS001' : 'CLI0001';
var expectedPattern = '^' + expectedPrefix + '[0-9]{3,}$';
if (!customerInfo || customerInfo.options.validator.$jsonSchema.properties._id.pattern !== expectedPattern) {
  throw Error('Validador de customers incompatible');
}
var customerIndexes = labDb.customers.getIndexes();
if (!customerIndexes.some(index => index.name === 'uq_customers_document_number' && index.unique === true)) {
  throw Error('Índice único de documento incompatible');
}
if (labDb.customers.countDocuments({_id: expectedId}) !== 1) {
  throw Error('Semilla ' + expectedId + ' incorrecta');
}

print('MongoDB: contrato ' + requested + ' verificado');
