require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW() AS hora, version() AS version')
  .then(res => {
    console.log('✅ Conectado a Supabase');
    console.log('Hora del servidor:', res.rows[0].hora);
    console.log('Versión:', res.rows[0].version.split(',')[0]);
  })
  .catch(err => console.error('❌ Error:', err.message))
  .finally(() => pool.end());