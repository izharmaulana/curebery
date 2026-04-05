import pg from 'pg';
const url = process.env.DATABASE_URL.replace(':5432/', ':6543/');
console.log('Testing with:', url.replace(/:([^@]+)@/, ':****@'));
const pool = new pg.Pool({connectionString: url});
pool.query('SELECT 1').then(r => console.log('KONEKSI OK:', r.rows)).catch(e => console.log('ERROR:', e.message));
