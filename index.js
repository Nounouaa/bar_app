const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

// Routes et middleware
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");

// Modèles Sequelize
const { sequelize, Produit, Vente, Achat, Utilisateur } = require("./models");

const app = express();
app.use(cors());
app.use(express.json());

// ===== ROUTES =====

// Auth
app.use("/api/auth", authRoutes);

// Produits (admin uniquement)
app.get("/api/produits", authMiddleware(["admin", "caissier"]), async (req, res) => {
  const produits = await Produit.findAll();
  res.json(produits);
});

app.post("/api/produits", authMiddleware(["admin"]), async (req, res) => {
  const produit = await Produit.create(req.body);
  res.json(produit);
});


// Modifier un produit
app.put("/api/produits/:id", authMiddleware(["admin"]), async (req, res) => {
  const produit = await Produit.findByPk(req.params.id);
  if (!produit) return res.status(404).json({ error: "Produit introuvable" });
  await produit.update(req.body);
  res.json(produit);
});

// Supprimer un produit
app.delete("/api/produits/:id", authMiddleware(["admin"]), async (req, res) => {
  const produit = await Produit.findByPk(req.params.id);
  if (!produit) return res.status(404).json({ error: "Produit introuvable" });
  await produit.destroy();
  res.json({ message: "Produit supprimé" });
});

// Ventes (caissier)
app.post("/api/ventes", authMiddleware(["caissier"]), async (req, res) => {
  const { produit_id, quantite } = req.body;
  const produit = await Produit.findByPk(produit_id);

  if (!produit || produit.stock < quantite) {
    return res.status(400).json({ error: "Stock insuffisant" });
  }

  produit.stock -= quantite;
  await produit.save();

  const vente = await Vente.create({ produit_id, quantite });
  res.json(vente);
});

app.post("/api/ventes/multi", authMiddleware(["caissier"]), async (req, res) => {
  const { ventes } = req.body;
  try {
    for (const v of ventes) {
      const produit = await Produit.findByPk(v.produit_id);
      if (!produit || produit.stock < v.quantite) {
        return res.status(400).json({ error: `Stock insuffisant pour ${produit?.nom}` });
      }
      produit.stock -= v.quantite;
      await produit.save();
      await Vente.create({ produit_id: v.produit_id, quantite: v.quantite });
    }
    res.json({ message: "Vente multi-produits enregistrée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement des ventes" });
  }
});


// Achats (admin)
app.post("/api/achats", authMiddleware(["admin"]), async (req, res) => {
  const { produit_id, quantite } = req.body;
  const produit = await Produit.findByPk(produit_id);

  if (!produit) {
    return res.status(404).json({ error: "Produit introuvable" });
  }

  produit.stock += quantite;  // ⚡ on augmente le stock
  await produit.save();

  const achat = await Achat.create({ produit_id, quantite });
  res.json(achat);
});

// Rapports bénéfices (admin)
app.get("/api/rapports/benefices", authMiddleware(["admin"]), async (req, res) => {
  const ventes = await Vente.findAll({ include: Produit });
  let benefices = 0;
  ventes.forEach(v => {
    benefices += (v.Produit.prix_vente - v.Produit.prix_achat) * v.quantite;
  });
  res.json({ benefices });
});

// Stock restant (admin uniquement)
app.get("/api/rapports/stock", authMiddleware(["admin"]), async (req, res) => {
  try {
    const produits = await Produit.findAll({
      attributes: ['id', 'nom', 'categorie', 'prix_achat', 'prix_vente', 'stock']
    });
    res.json(produits);
  } catch (err) {
    console.error("Erreur récupération stock :", err);
    res.status(500).json({ error: "Impossible de récupérer le stock" });
  }
});


app.get("/api/rapports/complet", authMiddleware(["admin"]), async (req, res) => {
  try {
    // Récupérer toutes les ventes avec les produits associés
    const ventes = await Vente.findAll({ include: Produit });
    let benefices = 0;
    ventes.forEach(v => {
      benefices += (v.Produit.prix_vente - v.Produit.prix_achat) * v.quantite;
    });

    // Récupérer tous les produits pour le stock
    const produits = await Produit.findAll({
      attributes: ['id', 'nom', 'categorie', 'prix_achat', 'prix_vente', 'stock']
    });

    res.json({
      benefices,
      produits,
      totalVentes: ventes.length
    });
  } catch (err) {
    console.error("Erreur rapport complet :", err);
    res.status(500).json({ error: "Impossible de générer le rapport" });
  }
});

// ===== SERVEUR =====
const PORT = 3000;

async function createTestUsers() {
  // Admin
  const testAdmin = await Utilisateur.findOne({ where: { nom: "testadmin" } });
  if (!testAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await Utilisateur.create({
      nom: "testadmin",
      mot_de_passe: hashedPassword,
      role: "admin"
    });
    console.log("Utilisateur admin créé : nom=testadmin, mot_de_passe=admin123");
  } else {
    console.log("Utilisateur admin déjà présent");
  }

  // Caissier
  const testCaissier = await Utilisateur.findOne({ where: { nom: "caissier1" } });
  if (!testCaissier) {
    const hashedPassword = await bcrypt.hash("caissier123", 10);
    await Utilisateur.create({
      nom: "caissier1",
      mot_de_passe: hashedPassword,
      role: "caissier"
    });
    console.log("Utilisateur caissier créé : nom=caissier1, mot_de_passe=caissier123");
  } else {
    console.log("Utilisateur caissier déjà présent");
  }
}

// Appel de la fonction au démarrage après sequelize.sync()
async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Tables synchronisées avec PostgreSQL !");
    
    // Création automatique des utilisateurs test
    await createTestUsers();

    app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Erreur de synchronisation :", err);
  }
}

startServer();
