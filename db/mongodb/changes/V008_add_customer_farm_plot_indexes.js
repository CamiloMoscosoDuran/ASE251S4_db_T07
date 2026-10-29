// Seleccionar la base de datos de la aplicación
db = db.getSiblingDB('AgroTecnoDB');

// =============================================================================
// V008 - Agregar índices de acceso frecuente en la colección customer
// =============================================================================
// CONTEXTO:
//   Dos patrones de consulta identificados como lentos sin índice:
//   1. Filtrar clientes por el tipo de cultivo (farm_plot.type_crop):
//      Utilizado para segmentar clientes según su producción agrícola.
//      farm_plot es un array de objetos → se usa un índice multikey.
//   2. Filtrar clientes por estado (status) y ordenar/filtrar por fecha de
//      registro (registration_date): Consulta frecuente en reportes y paginación.
//      El índice compuesto cubre ambos campos en una sola operación.
// =============================================================================

// Verificar que la colección existe antes de operar
const collectionExists = db.getCollectionInfos({ name: 'customer' }).length > 0;
if (!collectionExists) {
  throw Error('La colección customer no existe. Verifique que V001 y V003 fueron ejecutados.');
}

// 1. ÍNDICE MULTIKEY sobre farm_plot.type_crop
//    Como farm_plot es un array, MongoDB crea automáticamente un índice multikey,
//    permitiendo buscar clientes por tipo de cultivo en cualquier parcela.
db.customer.createIndex(
  { 'farm_plot.type_crop': 1 },
  { name: 'ix_customer_type_crop' }
);

// 2. ÍNDICE COMPUESTO sobre status + registration_date
//    Cubre consultas del tipo: clientes activos ordenados por fecha de registro.
//    El orden (status ASC, registration_date DESC) refleja el patrón de uso más común.
db.customer.createIndex(
  { status: 1, registration_date: -1 },
  { name: 'ix_customer_status_registration' }
);

print('V008: Índices ix_customer_type_crop e ix_customer_status_registration creados correctamente en la colección customer.');
