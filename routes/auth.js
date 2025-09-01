const express = require("express");
const router = express.Router();
const { Utilisateur } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = "supersecret"; // ⚠️ à mettre dans .env

// Inscription (admin uniquement)
router.post("/register", async (req, res) => {
  try {
    const { nom, mot_de_passe, role } = req.body;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const user = await Utilisateur.create({ nom, mot_de_passe: hash, role });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  const { nom, mot_de_passe } = req.body;
  const user = await Utilisateur.findOne({ where: { nom } });

  if (!user) return res.status(400).json({ error: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
  if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" });

  res.json({ token, role: user.role });
});

module.exports = router;
