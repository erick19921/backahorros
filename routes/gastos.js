import express from 'express';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ==============================
// 📂 CONFIGURACIÓN DE MULTER
// ==============================
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ==============================
// 🔹 REGISTRAR GASTO (con imagen)
// ==============================
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
  const { descripcion, monto, fecha } = req.body;
  const imagen_url = req.file
    ? `https://backahorros.onrender.com/uploads/${req.file.filename}`
    : null;

  try {
    const result = await pool.query(
      `INSERT INTO gastos (usuario_id, descripcion, monto, fecha, imagen_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.usuarioId, descripcion, monto, fecha, imagen_url]
    );

    res.status(201).json({
      gasto: result.rows[0],
      mensaje: 'Gasto registrado correctamente',
    });
  } catch (error) {
    console.error('❌ Error al registrar gasto:', error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

// ==============================
// 🔹 LISTAR GASTOS DEL USUARIO AUTENTICADO
// ==============================

router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE usuario_id = $1',
      [req.usuarioId]
    );
    res.json({ total: result.rows[0].total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el total de gastos del usuario' });
  }
});


// ==============================
// 🔹 CALCULAR SALDO GLOBAL (Aportes - Gastos)
// ==============================
router.get('/saldo-total', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(monto), 0) FROM aportes) -
        (SELECT COALESCE(SUM(monto), 0) FROM gastos)
      AS saldo_total;
    `);

    res.json({ saldo: result.rows[0].saldo_total });
  } catch (error) {
    console.error('❌ Error al calcular saldo total:', error);
    res.status(500).json({ error: 'Error al calcular saldo total' });
  }
});

export default router;
