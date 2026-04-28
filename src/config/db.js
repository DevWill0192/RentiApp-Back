import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config'; // Asegúrate de tener instalada la librería dotenv

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Configuración necesaria para Supabase:
  ssl: {
    rejectUnauthorized: false // Permite la conexión segura
  }
});

// Prueba de conexión
pool.query('SELECT current_database()')
  .then(res => console.log('Conectado con éxito a la base de datos:', res.rows[0].current_database))
  .catch(err => console.error('Error de conexión:', err.message));