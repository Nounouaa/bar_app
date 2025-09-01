"use strict";
module.exports = (sequelize, DataTypes) => {
  const Vente = sequelize.define("Vente", {
    produit_id: DataTypes.INTEGER,
    quantite: DataTypes.INTEGER
  }, {});
  Vente.associate = function(models) {
    Vente.belongsTo(models.Produit, { foreignKey: "produit_id" });
  };
  return Vente;
};
