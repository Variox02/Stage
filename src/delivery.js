import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()


router.get('/api/deliverylist', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' })
    }

    try {
        const result = await pool.query('SELECT id, create_date, id_commande, delivery_address, id_delivery FROM delivery WHERE isdelivered = false ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

router.put('/api/deliverylist/:id/take', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' })
    }

    try {
        const { id } = req.params
        const id_livreur = decoded.id

        await pool.query(
            'UPDATE delivery SET id_delivery = $1 WHERE id = $2',
            [id_livreur, id]
        )

        res.json({ success: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})




















export default router
