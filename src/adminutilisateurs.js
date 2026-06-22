import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

// Routes d'administration pour la gestion des utilisateurs
// Ce fichier expose des endpoints protégés par JWT destinés
// uniquement aux comptes administrateurs. Les routes effectuent
// des requêtes SQL via le pool PostgreSQL et renvoient des JSON.

const router = express.Router()


// GET /api/users
// - Vérifie la présence et la validité d'un token JWT dans les cookies
// - Vérifie que l'utilisateur est administrateur (`isadmin` dans le token)
// - Retourne la liste des utilisateurs avec leurs rôles et coordonnées
router.get('/api/users', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // Seuls les administrateurs peuvent accéder à cette route
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        // Récupère les champs pertinents pour l'interface d'administration
        const result = await pool.query(
            'SELECT id, first_name, name, email, telephone, address, isadmin, isdelivery FROM utilisateur ORDER BY first_name ASC'
        )
        res.json(result.rows)

    } catch (err) {
        console.error(err)
        // Erreur d'authentification ou token invalide
        return res.status(401).json({ error: 'Token invalide' })
    }
})

// PUT /api/users/:id
// - Met à jour les informations d'un utilisateur (nom, email, rôles, etc.)
// - Nécessite un token JWT d'administrateur
router.put('/api/users/:id', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const { id } = req.params
        // Champs attendus depuis le corps de la requête
        const { first_name, name, email, telephone, address, isadmin, isdelivery } = req.body

        // Mise à jour sécurisée avec paramètres pour éviter les injections SQL
        await pool.query(
            'UPDATE utilisateur SET first_name = $1, name = $2, email = $3, telephone = $4, address = $5, isadmin = $6, isdelivery = $7 WHERE id = $8',
            [first_name, name, email, telephone, address, isadmin, isdelivery, id]
        )

        res.json({ success: true })

    } catch (err) {
        console.error(err)
        // Erreur d'authentification ou autre problème lors de la validation
        return res.status(401).json({ error: 'Token invalide' })
    }
})



// Exporter le routeur pour l'utiliser dans l'application principale
// Export du routeur pour être monté dans l'application principale (e.g. app.use)
export default router