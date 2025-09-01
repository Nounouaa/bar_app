"use strict";
module.exports = (sequelize, DataTypes) => {
  const Produit = sequelize.define("Produit", {
    nom: DataTypes.STRING,
    categorie: DataTypes.ENUM("boisson", "tsaky"),
    prix_achat: DataTypes.DECIMAL,
    prix_vente: DataTypes.DECIMAL,
    stock: DataTypes.INTEGER
  }, {});
  Produit.associate = function(models) {
    Produit.hasMany(models.Vente, { foreignKey: "produit_id" });
    Produit.hasMany(models.Achat, { foreignKey: "produit_id" });
  };
  return Produit;
};
