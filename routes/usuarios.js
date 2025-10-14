import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = express.Router();

// Registro
router.post('/registro', async (req, res) => {
  const { nombre, usuario, contrasena } = req.body;

  try {
    const hash = await bcrypt.hash(contrasena, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, usuario, contrasena) VALUES ($1, $2, $3) RETURNING *',
      [nombre, usuario, hash]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];
    const esValida = await bcrypt.compare(contrasena, user.contrasena);
    if (!esValida)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Genera el token con el ID del usuario
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'clave_por_defecto',
      { expiresIn: '1h' }
    );


    // ✅ Envía también el nombre y el usuario
    res.json({
      token,
      nombre: user.nombre,
      usuario: user.usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;
