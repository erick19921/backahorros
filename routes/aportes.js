import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// === CONFIGURACIÓN MULTER ===
// Configurar Multer con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aportes_familiares', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// === LISTAR APORTES ===
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM aportes WHERE usuario_id = $1',
      [req.usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar aportes' });
  }
});

// === CREAR APORTES (CON IMAGEN) ===
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
  const { monto, numero_aporte, fecha, banco } = req.body;
  const imagenUrl = req.file ? req.file.path : null; // URL directa de Cloudinary

  try {
    const result = await pool.query(
      `INSERT INTO aportes (usuario_id, monto, numero_aporte, fecha, banco, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.usuarioId, monto, numero_aporte, fecha, banco, imagenUrl]
    );
    res.json({
      aporte: result.rows[0],
      mensaje: 'Aporte guardado correctamente en Cloudinary',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear aporte' });
  }
});

// === ACTUALIZAR APORTES ===
router.put('/:id', verificarToken, upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, numero_aporte, fecha, banco } = req.body;
    const imagen_url = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : req.body.imagen_url;

    const result = await pool.query(
      `UPDATE aportes
       SET monto=$1, numero_aporte=$2, fecha=$3, banco=$4, imagen_url=$5
       WHERE id=$6 AND usuario_id=$7
       RETURNING *`,
      [monto, numero_aporte, fecha, banco, imagen_url, id, req.usuarioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No encontrado o no autorizado' });

    res.json({ mensaje: 'Aporte actualizado correctamente', aporte: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar aporte' });
  }
});

// === ELIMINAR APORTES ===
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM aportes WHERE id=$1 AND usuario_id=$2 RETURNING *',
      [id, req.usuarioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No encontrado o no autorizado' });

    res.json({ mensaje: 'Aporte eliminado correctamente', aporte: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar aporte' });
  }
});

// === APORTES DE USUARIO ===
// ✅ Obtener el total de aportes del usuario logueado //
router.get('/total', verificarToken, async (req, res) => {
  try {
    // PostgreSQL calcula la suma directamente
    const result = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM aportes WHERE usuario_id = $1',
      [req.usuarioId]
    );

    // Retorna el total como número
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener total de aportes' });
  }
});

export default router;
