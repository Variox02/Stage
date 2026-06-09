import express from 'express'
import cors from 'cors'
import pool from './config/db.js'
import bcrypt from 'bcrypt'

const app = express()
app.use(cors())
app.use(express.json()) 
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

app.post('/api/inscription', async (req, res) => {
  try{
    const { email, password, newsletter, first_name, name } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query('INSERT INTO utilisateur (email, password, newsletter, first_name, name) VALUES ($1, $2, $3, $4, $5)',  [email, hashedPassword, newsletter, first_name, name])
    res.status(201).json({message: 'Compte créé avec succès !'})
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur'})
  }
})

app.listen(3000, () => console.log('Serveur lancé sur http://localhost:3000'))
