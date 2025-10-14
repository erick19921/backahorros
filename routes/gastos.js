import express from 'express';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import multer from 'multer';
import cloudinary from 'cloudinary';
import fs from 'fs';

const router = express.Router();

// ✅ Configuración de Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer (almacenamiento temporal en memoria)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==============================
// 🔹 REGISTRAR GASTO (con imagen subida a Cloudinary)
// ==============================
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
  const { descripcion, monto, fecha } = req.body;

  try {
    let imagen_url = null;

    // 📤 Subir imagen a Cloudinary (si existe)
    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.v2.uploader.upload(base64Image, {
        folder: 'gastos_app',
      });
      imagen_url = uploadResult.secure_url;
    }

    // 🧾 Guardar en la base de datos
    const result = await pool.query(
      `INSERT INTO gastos (usuario_id, descripcion, monto, fecha, imagen_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.usuarioId, descripcion, monto, fecha, imagen_url]
    );

    res.status(201).json({
      mensaje: '✅ Gasto registrado correctamente',
      gasto: result.rows[0],
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
      'SELECT * FROM gastos WHERE usuario_id = $1 ORDER BY fecha DESC',
      [req.usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener gastos:', error);
    res.status(500).json({ error: 'Error al obtener los gastos del usuario' });
  }
});

// ==============================
// 🔹 OBTENER TOTAL DE GASTOS POR USUARIO
// ==============================
router.get('/total', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE usuario_id = $1',
      [req.usuarioId]
    );
    res.json({ total: result.rows[0].total });
  } catch (error) {
    console.error('❌ Error al obtener total de gastos:', error);
    res.status(500).json({ error: 'Error al obtener el total de gastos' });
  }
});

// ==============================
// 🔹 SALDO GLOBAL (Aportes - Gastos)
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
