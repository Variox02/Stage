import express from 'express'
import pool from './config/db.js'

const app = express()
app.use(express.static('public'))

app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM product')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000')
})