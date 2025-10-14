import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.js";
import aportesRoutes from "./routes/aportes.js";
import gastosRoutes from "./routes/gastos.js";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/aportes", aportesRoutes);
app.use("/api/gastos", gastosRoutes);

// 👇 IMPORTANTE: No pongas app.listen()
export default app;