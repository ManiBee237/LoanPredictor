const DecisionTree = require("decision-tree");

function trainDecisionTree(rows, features, target){
  const dt = new DecisionTree(rows, target, features);
  return { features, target, tree: dt.toJSON() };
}

function predictLabelTree(model, obj){
  const dt = DecisionTree.fromJSON(model.tree);
  return dt.predict(obj);
}

function predictProbaTree(model, features, obj){
  const label = predictLabelTree(model, obj);
  return Number(label) === 1 ? 1 : 0;
}

module.exports = { trainDecisionTree, predictProbaTree };
