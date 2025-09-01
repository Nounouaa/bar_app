const jwt = require("jsonwebtoken");
const SECRET = "supersecret"; // ⚠️ à mettre dans .env

function authMiddleware(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "Token manquant" });

    const token = authHeader.split(" ")[1];
    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Token invalide" });

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      req.user = user;
      next();
    });
  };
}

module.exports = authMiddleware;
