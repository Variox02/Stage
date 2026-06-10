import express from 'express'
import cors from 'cors'
import pool from './config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

const app = express()
app.use(cors({
  origin: 'http://localhost',
  credentials: true   
}))
app.use(express.json()) 
app.use(express.static('public'))
app.use(cookieParser())

import editProfilRouter from './editprofil.js'

app.use(editProfilRouter)

//Obtenir tous les products pour les afficher
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price, stock FROM product WHERE stock > 0 ORDER BY name ASC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

//Check si mail déjà utilisé
app.post('/api/verifMail', async (req, res) => {
  try {
    const { email } = req.body
    const result = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email])
    res.json({ exists: result.rowCount > 0 })  
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})
//Requête insertion BDD
app.post('/api/inscription', async (req, res) => {
  try{
    const { email, password, newsletter, first_name, name, country, birth_date, address } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query('INSERT INTO utilisateur (email, password, newsletter, first_name, name, country, birth_date, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',  [email, hashedPassword, newsletter, first_name, name, country, birth_date, address])
    res.status(201).json({message: 'Compte créé avec succès !'})
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur'})
  }
})

//Requête vérif Connexion
app.post('/api/connexion', async (req, res) => {
  try{
    const { email, password } = req.body
    const result = await pool.query('SELECT id, first_name, email, password, isadmin, isdelivery FROM utilisateur WHERE email = $1', [email])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }
    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }
    //Création du token JWT
    const token = jwt.sign(
      { id: user.id},
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.cookie('token', token, {
      httpOnly: true,    
      secure: false,     
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000  
    })
    res.status(200).json({ message: 'Connecté !', first_name: user.first_name })
  }catch (err){
      console.error(err)
      res.status(500).json({error: 'Erreur serveur'})
    }
})

//api de Vérif du user et de ses infos
app.get('/api/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Non connecté' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query('SELECT id, first_name, email, isadmin, isdelivery FROM utilisateur WHERE id = $1',[decoded.id])

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable' })
    }

    res.json({ user: result.rows[0] })

  } catch {
    res.status(401).json({ error: 'Session expirée' })
  }
})

//Déconnexion/clear du cookie
app.post('/api/deconnexion', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax'
  })
  res.json({ message: 'Déconnecté !' })
})


app.listen(3000, () => console.log('Serveur lancé sur http://localhost:3000'))