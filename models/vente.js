// models/vente.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const Vente = sequelize.define("Vente", {
    produit_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});

  Vente.associate = function(models) {
    Vente.belongsTo(models.Produit, { foreignKey: "produit_id" });
  };

  return Vente;
};
