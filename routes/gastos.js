import express from 'express';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// 🔹 Registrar gasto
router.post('/', verificarToken, async (req, res) => {
  const { descripcion, monto, fecha } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO gastos (usuario_id, descripcion, monto, fecha)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.usuarioId, descripcion, monto, fecha]
    );
    res.status(201).json({ gasto: result.rows[0], mensaje: 'Gasto registrado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

// 🔹 Listar gastos del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM gastos WHERE usuario_id = $1 ORDER BY fecha DESC',
      [req.usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// 🔹 Calcular saldo total global (aportes - gastos)
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
    console.error(error);
    res.status(500).json({ error: 'Error al calcular saldo total' });
  }
});

export default router;
