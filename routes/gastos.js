// routes/gastos.js
import express from "express";
import multer from "multer";
import cloudinary from '../config/cloudinary.js';
import pool from "../db.js";
import { verificarToken } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Crear gasto (con imagen opcional)
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  const { descripcion, monto, fecha } = req.body;

  try {
    let imagen_url = null;

    if (req.file) {
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64"
      )}`;
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "gastos_app",
      });
      imagen_url = uploadResult.secure_url;
    }

    const result = await pool.query(
      `INSERT INTO gastos (usuario_id, descripcion, monto, fecha, imagen_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.usuarioId, descripcion, monto, fecha, imagen_url]
    );

    res.status(201).json({
      mensaje: "✅ Gasto registrado correctamente",
      gasto: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error al registrar gasto:", error);
    res.status(500).json({ error: "Error al registrar gasto" });
  }
});

// Listar gastos del usuario
router.get("/", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM gastos WHERE usuario_id = $1 ORDER BY fecha DESC",
      [req.usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener gastos:", error);
    res.status(500).json({ error: "Error al obtener los gastos del usuario" });
  }
});

// Total de gastos del usuario
router.get("/total", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM gastos WHERE usuario_id = $1",
      [req.usuarioId]
    );
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error("❌ Error al obtener total de gastos:", error);
    res.status(500).json({ error: "Error al obtener el total de gastos" });
  }
});

// Saldo global (aportes - gastos) [público]
router.get("/saldo-total", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(monto), 0) FROM aportes) -
        (SELECT COALESCE(SUM(monto), 0) FROM gastos)
      AS saldo_total;
    `);

    res.json({ saldo: parseFloat(result.rows[0].saldo_total) });
  } catch (error) {
    console.error("❌ Error al calcular saldo total:", error);
    res.status(500).json({ error: "Error al calcular saldo total" });
  }
});

// =============================
// 🔹 LISTAR TODOS LOS GASTOS (GLOBAL)
// =============================
router.get("/todos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.id, g.descripcion, g.monto, g.fecha, g.imagen_url,
             u.nombre AS usuario_nombre
      FROM gastos g
      JOIN usuarios u ON g.usuario_id = u.id
      ORDER BY g.fecha DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener gastos globales:", error);
    res.status(500).json({ error: "Error al obtener gastos globales" });
  }
});

// =============================
// 🔹 TOTAL GLOBAL DE GASTOS
// =============================
router.get("/total-global", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(monto), 0) AS total
      FROM gastos;
    `);
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error("❌ Error al obtener total global de gastos:", error);
    res.status(500).json({ error: "Error al obtener total global de gastos" });
  }
});


export default router;
