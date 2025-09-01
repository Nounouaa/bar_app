"use strict";
module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define("Utilisateur", {
    nom: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    role: {
      type: DataTypes.ENUM("admin", "caissier"),
      allowNull: false
    },
    mot_de_passe: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  return Utilisateur;
};
