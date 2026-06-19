import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

// Routes liées à la gestion des livraisons (espace livreur)
// - GET  /api/deliverylist           : Récupère les livraisons non livrées
// - PUT  /api/deliverylist/:id/take  : Prend en charge (assigne) une livraison
// Les vérifications d'authentification utilisent le token JWT présent en cookie.


router.get('/api/deliverylist', async (req, res) => {
    // Récupération et vérification du token JWT envoyé en cookie
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        // Vérifie simplement que le token est valide (on n'extrait pas les données ici)
        jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' })
    }

    try {
        // Récupère les livraisons non encore marquées comme livrées
        const result = await pool.query('SELECT id, date_delivery, id_commande, delivery_address, id_delivery FROM delivery WHERE isdelivered = false ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

router.put('/api/deliverylist/:id/take', async (req, res) => {
    // Vérifie la présence du token
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    let decoded
    try {
        // Décode le token pour obtenir l'id du livreur qui effectue la requête
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' })
    }

    try {
        const { id } = req.params
        const id_livreur = decoded.id

        // Assigne la livraison à l'id du livreur connecté
        await pool.query(
            'UPDATE delivery SET id_delivery = $1 WHERE id = $2',
            [id_livreur, id]
        )

        // Réponse simple côté client pour indiquer le succès
        res.json({ success: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})




















export default router
