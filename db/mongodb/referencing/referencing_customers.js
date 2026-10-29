```javascript
// REFERENCING - Módulo de Clientes
// Base de datos: AgroTecnoDB

// Ejemplo 1: Consultar el historial de visitas de un cliente
db.getSiblingDB("AgroTecnoDB").customers.aggregate([
  { $match: { _id: "CUS001" } },
  {
    $lookup: {
      from: "field_meetings",
      localField: "_id",
      foreignField: "customer_id",
      as: "historial_visitas"
    }
  },
  {
    $project: {
      _id: 1,
      first_name: 1,
      last_name: 1,
      historial_visitas: 1
    }
  }
]);

// Ejemplo 2: Consultar las visitas de los clientes activos
db.getSiblingDB("AgroTecnoDB").customers.aggregate([
  { $match: { status: true } },
  {
    $lookup: {
      from: "field_meetings",
      localField: "_id",
      foreignField: "customer_id",
      as: "visitas"
    }
  },
  {
    $project: {
      _id: 1,
      first_name: 1,
      last_name: 1,
      farm_plot: 1,
      visitas: 1
    }
  }
]);
```