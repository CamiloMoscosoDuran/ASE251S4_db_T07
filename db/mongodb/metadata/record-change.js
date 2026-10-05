var adminDb = db.getSiblingDB('admin');
if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
  throw Error('No se pudo autenticar el administrador MongoDB');
}

var labDb = db.getSiblingDB(process.env.MONGO_DATABASE);
if (labDb.getCollectionInfos({name: 'schema_changes'}).length === 0) {
  labDb.createCollection('schema_changes');
  labDb.schema_changes.createIndex({sequence: 1}, {unique: true, name: 'uq_schema_change_sequence'});
}

labDb.schema_changes.insertOne({
  sequence: NumberInt(Number(process.env.CHANGE_SEQUENCE)),
  changeId: process.env.CHANGE_ID,
  checksum: process.env.CHANGE_CHECKSUM,
  gitSha: process.env.GIT_SHA,
  releaseVersion: process.env.RELEASE_VERSION,
  appliedAt: new Date()
});
