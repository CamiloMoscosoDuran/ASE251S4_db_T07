```javascript
// REFERENCING - Módulo de Fórmulas
// Base de datos: AgroTecnoDB

//Ejemplo 1: Búsqueda por ID Específico de los insumos que componen una fórmula
db.formulas.aggregate([
  {
    $match: { "_id": "FOR006" }
  },
  {
    $lookup: {
      from: "supply",
      localField: "recipe.ingredients.supply_id",
      foreignField: "_id",
      as: "insumo_vinculado"
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      recipe: 1,
      insumo_vinculado: 1
    }
  }
]);


// Ejemplo 2: Búsqueda Masiva de Fórmulas Activas y su lista de insumos vinculados
db.formulas.aggregate([
  {
    $match: { "status": true }
  },
  {
    $lookup: {
      from: "supply",
      localField: "recipe.ingredients.supply_id",
      foreignField: "_id",
      as: "lista_insumos_requeridos"
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      suggested_price: 1,
      "recipe.version": 1,
      "recipe.ingredients.supply_id": 1,
      lista_insumos_requeridos: 1
    }
  }
]);

```