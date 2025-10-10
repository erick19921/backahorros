import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import gastosRoutes from './routes/gastos.js';
dotenv.config();


import usuariosRoutes from "./routes/usuarios.js";
import aportesRoutes from "./routes/aportes.js";
import gastosRoutes from './routes/gastos.js';

const app = express();

// ✅ Usa cors y json
app.use(cors());
app.use(express.json());

// ✅ Aquí ya puedes servir los archivos estáticos
app.use('/uploads', express.static('uploads'));

// ✅ Rutas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/aportes', aportesRoutes);
app.use('/api/gastos', gastosRoutes);

// ✅ Puerto del servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en: ${PORT}`);
});