// routes/aportes.js
import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
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

// Multer con Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aportes_familiares",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

// Listar aportes del usuario
router.get("/", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM aportes WHERE usuario_id = $1",
      [req.usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar aportes" });
  }
});

// Crear aporte (con imagen)
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  const { monto, numero_aporte, fecha, banco } = req.body;
  const imagenUrl = req.file ? req.file.path : null; // URL directa Cloudinary

  try {
    const result = await pool.query(
      `INSERT INTO aportes (usuario_id, monto, numero_aporte, fecha, banco, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.usuarioId, monto, numero_aporte, fecha, banco, imagenUrl]
    );
    res.json({
      aporte: result.rows[0],
      mensaje: "Aporte guardado correctamente en Cloudinary",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear aporte" });
  }
});

// Actualizar aporte (imagen opcional)
router.put("/:id", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, numero_aporte, fecha, banco, imagen_url: imagenAnterior } =
      req.body;

    const imagen_url = req.file ? req.file.path : imagenAnterior;

    const result = await pool.query(
      `UPDATE aportes
       SET monto=$1, numero_aporte=$2, fecha=$3, banco=$4, imagen_url=$5
       WHERE id=$6 AND usuario_id=$7
       RETURNING *`,
      [monto, numero_aporte, fecha, banco, imagen_url, id, req.usuarioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "No encontrado o no autorizado" });

    res.json({ mensaje: "Aporte actualizado correctamente", aporte: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar aporte" });
  }
});

// Eliminar aporte
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM aportes WHERE id=$1 AND usuario_id=$2 RETURNING *",
      [id, req.usuarioId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "No encontrado o no autorizado" });

    res.json({ mensaje: "Aporte eliminado correctamente", aporte: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar aporte" });
  }
});

// Totales
router.get("/total", verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM aportes WHERE usuario_id = $1",
      [req.usuarioId]
    );
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener total de aportes" });
  }
});

router.get("/total-general", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM aportes"
    );
    res.json({ total: parseFloat(result.rows[0].total) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener total general" });
  }
});

export default router;
