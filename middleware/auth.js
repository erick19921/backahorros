import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Formato: "Bearer token"
  if (!token) {
    return res.status(403).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'clave_por_defecto'
    );
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}
