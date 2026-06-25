const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = 'sacred_word_secret_key_123456789'

app.use(cors())
app.use(express.json())

let db

// Initialize database
async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  })

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `)
  console.log('SQLite Database Initialized & Users Table Checked/Created')
}

// Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await db.get('SELECT id, name, email, createdAt FROM users WHERE id = ?', [decoded.id])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Route: Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' })
  }

  try {
    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email])
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const userId = Date.now().toString()
    const createdAt = new Date().toISOString()

    // Insert user
    await db.run(
      'INSERT INTO users (id, name, email, password, createdAt) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, createdAt]
    )

    // Sign Token
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        createdAt
      }
    })
  } catch (err) {
    console.error('Registration Error:', err)
    res.status(500).json({ error: 'Database error during registration' })
  }
})

// Route: Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email])
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    // Sign Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (err) {
    console.error('Login Error:', err)
    res.status(500).json({ error: 'Database error during login' })
  }
})

// Route: Get Profile (Me)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.status(200).json({ user: req.user })
})

// Start server after connecting to database
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Auth Backend Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to start server:', err)
})
