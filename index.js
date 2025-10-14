import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.js";
import aportesRoutes from "./routes/aportes.js";
import gastosRoutes from "./routes/gastos.js";
import pool from "./db.js";

dotenv.config();

const app = express();

// 🔹 Middleware global
app.use(cors());
app.use(express.json());

// 🔹 (Opcional) Si usas archivos locales en Render, se puede dejar, 
// pero en Vercel no se almacenan permanentemente.
app.use("/uploads", express.static("uploads"));

// 🔹 Rutas principales
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/aportes", aportesRoutes);
app.use("/api/gastos", gastosRoutes);

// ✅ Exporta la app en lugar de iniciar el servidor
export default app;
