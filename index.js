import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import usuariosRoutes from "./routes/usuarios.js";
import aportesRoutes from "./routes/aportes.js";
import gastosRoutes from "./routes/gastos.js"; // ✅ solo una vez

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ RUTAS
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/aportes', aportesRoutes);
app.use('/api/gastos', gastosRoutes); // 👈 importante

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
