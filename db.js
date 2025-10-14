import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

let pool;

// ✅ Evita crear múltiples conexiones en entorno serverless (Vercel)
if (!global._pool) {
  global._pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // 👈 Necesario para Neon
    },
  });
}

pool = global._pool;

export default pool;

