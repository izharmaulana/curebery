import postgres from 'postgres'
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false })
const result = await sql`SELECT 1 as test`
console.log('KONEKSI OK:', result)
await sql.end()
