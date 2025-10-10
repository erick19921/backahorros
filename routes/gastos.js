import express from 'express';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js'; // importar tu config

const router = express.Router();

// Multer configuración temporal (local)
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
// 🔹 REGISTRAR GASTO (con imagen en Cloudinary)
// ==============================
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
    const { descripcion, monto, fecha } = req.body;

    let imagenUrl = null;

    try {
        if (req.file) {
            // Subir el archivo localmente recibido a Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'gastos', // carpeta en Cloudinary (opcional)
            });

            imagenUrl = result.secure_url;

            // Opcional: eliminar el archivo local después de subirlo
            fs.unlinkSync(req.file.path);
        }

        const resultDb = await pool.query(
            `INSERT INTO gastos (usuario_id, descripcion, monto, fecha, imagen_url)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.usuarioId, descripcion, monto, fecha, imagenUrl]
        );

        res.status(201).json({
            gasto: resultDb.rows[0],
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


// ✅ Todos los gastos con nombre de usuario
router.get('/todos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, u.nombre AS usuario_nombre
      FROM gastos g
      INNER JOIN usuarios u ON g.usuario_id = u.id
      ORDER BY g.fecha DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error al obtener gastos globales:', error);
    res.status(500).json({ error: 'Error al obtener los gastos globales' });
  }
});

// ✅ Total global de gastos
router.get('/total-global', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COALESCE(SUM(monto), 0) AS total FROM gastos'
    );
    res.json({ total: result.rows[0].total });
  } catch (error) {
    console.error('❌ Error al obtener total global:', error);
    res.status(500).json({ error: 'Error al obtener total global' });
  }
});

export default router;
