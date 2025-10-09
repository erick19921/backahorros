import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(" ")[1]; // "Bearer token"
  if (!token) return res.status(403).json({ error: 'Token requerido' });

  jwt.verify(token, 'secreto_ultra_seguro', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.usuarioId = decoded.id;
    next();
  });
}