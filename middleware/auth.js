// middleware/auth.js
import { verificarToken } from '../middleware/auth.js';
import jwt from "jsonwebtoken";

export function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(403).json({ error: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(403).json({ error: "Formato de token inválido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
