// Seleccionar la base de datos de la aplicación
db = db.getSiblingDB('AgroTecnoDB');

// =============================================================================
// V005 - Agregar índice sobre field_meeting.order_sales_id
// =============================================================================
// CONTEXTO:
//   El campo order_sales_id referencia a ventas.sales_order en SQL Server.
//   Sin índice, las consultas cross-database que filtran por este campo
//   realizan un collection scan completo, degradando el rendimiento.
// =============================================================================

// Verificar que la colección existe antes de operar
const collectionExists = db.getCollectionInfos({ name: 'field_meeting' }).length > 0;
if (!collectionExists) {
  throw Error('La colección field_meeting no existe. Verifique que V001 y V003 fueron ejecutados.');
}

// Crear índice sobre order_sales_id en field_meeting
// Permite lookup eficiente desde SQL Server → MongoDB al cruzar por pedido de venta
db.field_meeting.createIndex(
  { order_sales_id: 1 },
  { name: 'ix_field_meeting_order_sales_id' }
);

print('V005: Índice ix_field_meeting_order_sales_id creado correctamente en la colección field_meeting.');
