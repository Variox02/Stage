import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

// Cette route gère l'enregistrement d'une nouvelle commande.
// Le token JWT est attendu dans les cookies pour identifier l'utilisateur connecté.


router.post('/api/commande', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id_user = decoded.id

        const { items, deliveryCost, delivery } = req.body

        // Calcul du prix total de la commande à partir des articles et des frais de livraison.
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const total = subtotal + deliveryCost

        // 1. Créer la commande principale en base de données.
        const commandeResult = await pool.query(
            'INSERT INTO commande (price, id_user, delivery) VALUES ($1, $2, $3) RETURNING id',
            [total, id_user, delivery]
        )
        const id_commande = commandeResult.rows[0].id

        // 2. Créer les lignes de commande associées à cette commande.
        for (const item of items) {
            await pool.query(
                'INSERT INTO ligne_commande (id_commande, id_product, quantity, price_unit) VALUES ($1, $2, $3, $4)',
                [id_commande, item.id, item.quantity, item.price]
            )
        }

        res.json({ success: true, id_commande })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})







export default router