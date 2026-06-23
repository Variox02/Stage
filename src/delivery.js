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
        const result = await pool.query(`
            SELECT 
                d.id, d.date_delivery, d.id_commande, d.delivery_address, d.id_delivery,
                c.price,
                u.first_name, u.name, u.telephone
            FROM delivery d
            JOIN commande c ON c.id = d.id_commande
            JOIN utilisateur u ON u.id = c.id_user
            WHERE d.isdelivered = false
            ORDER BY d.id ASC
        `)
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

router.put('/api/deliverylist/:id/cancel', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return res.status(401).json({ error: 'Token invalide' })
    }

    try {
        const { id } = req.params

        // Remet id_delivery à NULL pour libérer la livraison
        await pool.query(
            'UPDATE delivery SET id_delivery = NULL WHERE id = $1 AND id_delivery = $2',
            [id, decoded.id]
        )

        res.json({ success: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})




















export default router
