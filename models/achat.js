"use strict";
module.exports = (sequelize, DataTypes) => {
  const Achat = sequelize.define("Achat", {
    produit_id: DataTypes.INTEGER,
    quantite: DataTypes.INTEGER
  }, {});
  Achat.associate = function(models) {
    Achat.belongsTo(models.Produit, { foreignKey: "produit_id" });
  };
  return Achat;
};
