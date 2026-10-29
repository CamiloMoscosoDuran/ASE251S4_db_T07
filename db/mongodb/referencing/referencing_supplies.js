// REFERENCING - Modulo de Insumos
// Base de datos: AgroTecnoDB

// Ejemplo 1: Buscar un insumo especifico y las formulas donde se utiliza.
db.getSiblingDB('AgroTecnoDB').supplies.aggregate([
  { $match: { _id: 'SUP0001' } },
  {
    $lookup: {
      from: 'formulas',
      localField: '_id',
      foreignField: 'recipe.ingredients.supply_id',
      as: 'formulas_donde_se_usa'
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      'inventory.current_stock': 1,
      unit: 1,
      formulas_donde_se_usa: 1
    }
  }
]);

// Ejemplo 2: Buscar insumos activos y sus formulas vinculadas.
db.getSiblingDB('AgroTecnoDB').supplies.aggregate([
  { $match: { status: true } },
  {
    $lookup: {
      from: 'formulas',
      localField: '_id',
      foreignField: 'recipe.ingredients.supply_id',
      as: 'recetas_vinculadas'
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      'inventory.current_stock': 1,
      'inventory.minimum_stock': 1,
      recetas_vinculadas: 1
    }
  }
]);
