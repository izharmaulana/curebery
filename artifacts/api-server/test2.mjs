console.log('DATABASE_URL:', process.env.DATABASE_URL);
import pg from 'pg';
const url = new URL(process.env.DATABASE_URL);
console.log('Host:', url.hostname);
console.log('Port:', url.port);
console.log('User:', url.username);
console.log('DB:', url.pathname);
