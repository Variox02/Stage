//Fonction JS de back pour afficher et edit le profil
import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

router.get('/api/getUser', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        const result = await pool.query('SELECT first_name, name, email, address, country, isadmin, isdelivery, newsletter, create_date, birth_date FROM utilisateur WHERE id = $1', [id])

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' })
        }

        res.json({ user: result.rows[0] })

    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

export default router