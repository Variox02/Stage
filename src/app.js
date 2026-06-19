// Point d'entrée du serveur Express et routes publiques / d'authentification.
// Ce fichier configure le middleware global et expose les routes REST pour l'application.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import pool from './config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'


const app = express()

// Configuration CORS pour autoriser les requêtes depuis le frontend.
// `origin: 'true'` est utilisé pour accepter les origines du navigateur
// lorsque `credentials: true` est activé. Cela permet d'envoyer le cookie JWT.
app.use(cors({
  origin: true,
  credentials: true
}))

// Middleware pour parser le JSON dans le corps des requêtes POST/PUT.
app.use(express.json())

// Sert les fichiers statiques depuis le dossier `public`.
// Cela permet d'héberger les pages HTML/CSS/JS client directement.
app.use(express.static('public'))

// Lecture des cookies sur les requêtes entrantes.
app.use(cookieParser())

// Import des routeurs.
import editProfilRouter from './editprofil.js'
import adminRouter from './admin.js'
import orderRouter from './validorder.js'
import paymentRouter from './payment.js'
import deliveryRouter from './delivery.js'

// Montage du routeur de livraison sur l'application.
app.use(deliveryRouter)
// Montage du routeur de paiement sur l'application.
app.use(paymentRouter)
// Montage du routeur de commande sur l'application.
app.use(orderRouter)
// Montage du routeur de profil sur l'application.
app.use(editProfilRouter)
//Routeur de la partie admin
app.use(adminRouter)

// -----------------------------------------------------------
// Route publique : liste des produits disponibles en stock
// -----------------------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    // Cherche uniquement les produits qui sont en stock.
    const result = await pool.query(
      'SELECT id, name, description, price, stock FROM product WHERE stock >= 0 ORDER BY name ASC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// -----------------------------------------------------------
// Route publique : vérifie si un email existe déjà
// -----------------------------------------------------------
app.post('/api/verifMail', async (req, res) => {
  try {
    const { email } = req.body
    const result = await pool.query('SELECT id FROM utilisateur WHERE email = $1', [email])

    // Renvoie un booléen qui indique si l'adresse est déjà enregistrée.
    res.json({ exists: result.rowCount > 0 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// -----------------------------------------------------------
// Route publique : création d'un nouveau compte utilisateur
// -----------------------------------------------------------
app.post('/api/inscription', async (req, res) => {
  try {
    const { email, password, newsletter, first_name, name, country, birth_date, address, telephone } = req.body

    // Hash du mot de passe avant insertion en base.
    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      'INSERT INTO utilisateur (email, password, newsletter, first_name, name, country, birth_date, address, telephone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [email, hashedPassword, newsletter, first_name, name, country, birth_date, address, telephone]
    )

    res.status(201).json({ message: 'Compte créé avec succès !' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// -----------------------------------------------------------
// Route publique : connexion utilisateur et génération du JWT
// -----------------------------------------------------------
app.post('/api/connexion', async (req, res) => {
  try {
    const { email, password } = req.body

    // Recherche de l'utilisateur par email.
    const result = await pool.query(
      'SELECT id, first_name, email, password, isadmin, isdelivery FROM utilisateur WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    const user = result.rows[0]

    // Vérifie le mot de passe fourni avec le hash stocké.
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    }

    // Génère un token JWT avec l'ID utilisateur.
    const token = jwt.sign(
      { id: user.id, isadmin: user.isadmin, isdelivery: user.isdelivery },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Stocke le token dans un cookie sécurisé côté client.
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })

    // Renvoie un message de succès et le prénom pour un affichage personnalisé.
    res.status(200).json({ message: 'Connecté !', first_name: user.first_name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// -----------------------------------------------------------
// Route protégée : vérifie le token et renvoie les infos de session
// -----------------------------------------------------------
app.get('/api/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Non connecté' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Récupère les informations utilisateur de base.
    const result = await pool.query(
      'SELECT id, first_name, email, telephone, isadmin, address, isdelivery FROM utilisateur WHERE id = $1',
      [decoded.id]
    )

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Utilisateur introuvable' })
    }

    res.json({ user: result.rows[0] })
  } catch {
    res.status(401).json({ error: 'Session expirée' })
  }
})

// -----------------------------------------------------------
// Route publique : déconnexion en effaçant le cookie JWT
// -----------------------------------------------------------
app.post('/api/deconnexion', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  })
  res.json({ message: 'Déconnecté !' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PORT}`)
})
