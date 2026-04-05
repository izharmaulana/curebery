import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)



import express from 'express'

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API HIDUP')
})

// API REGISTER
app.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body

  const { data, error } = await supabase
    .from('users')
    .insert([{ email, password_hash: password, name, role }])
    .select()

  if (error) {
    return res.json({ success: false, message: error.message })
  }

  res.json({ success: true, user: data[0] })
})

// API LOGIN
app.post('/login', async (req, res) => {
  try {
    console.log('BODY:', req.body)

    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.json({ success: false, message: 'Email/password kosong' })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return res.json({ success: false, message: 'User tidak ditemukan' })
    }

    if (data.password_hash !== password) {
      return res.json({ success: false, message: 'Password salah' })
    }

    return res.json({ success: true, user: data })

  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// jalanin server
const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server jalan di port ${PORT}`)
})