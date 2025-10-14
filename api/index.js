// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.js";
import aportesRoutes from "./routes/aportes.js";
import gastosRoutes from "./routes/gastos.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas de API
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/aportes", aportesRoutes);
app.use("/api/gastos", gastosRoutes);

// ❗️No uses app.listen en Vercel
export default app;
