// Backend router pour s'occuper de toute la partie administration du site (gestion des produits, commandes, utilisateurs, etc.).
// Ce fichier expose des routes protégées par JWT et utilise la base de données PostgreSQL.

import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

router.put('/api/products/:id/stock', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) {
            return res.status(403).json({ error: 'Accès refusé' })
        }

        const { id } = req.params
        const { stock } = req.body

        await pool.query('UPDATE product SET stock = $1 WHERE id = $2', [stock, id])
        res.json({ success: true })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})















export default router