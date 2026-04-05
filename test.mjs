import pg from 'pg';
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
pool.query('SELECT 1').then(r => console.log('KONEKSI OK:', r.rows)).catch(e => console.log('ERROR:', e.message));
