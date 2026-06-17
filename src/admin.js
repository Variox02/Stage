// Backend router pour s'occuper de toute la partie administration du site (gestion des produits, commandes, utilisateurs, etc.).
// Ce fichier expose des routes protégées par JWT et utilise la base de données PostgreSQL.

import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

/**
 * PUT /api/products/:id/stock
 * Met à jour le stock d'un produit
 * Nécessite un token JWT valide d'administrateur
 */
router.put('/api/products/:id/stock', async (req, res) => {
    // Récupérer le token JWT depuis les cookies
    const token = req.cookies.token
    // Vérifier que le token est présent
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        // Vérifier la validité du token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // Vérifier que l'utilisateur est administrateur
        if (!decoded.isadmin) {
            return res.status(403).json({ error: 'Accès refusé' })
        }

        // Récupérer l'ID du produit et la nouvelle quantité de stock
        const { id } = req.params
        const { stock } = req.body

        // Mettre à jour le stock dans la base de données
        await pool.query('UPDATE product SET stock = $1 WHERE id = $2', [stock, id])
        res.json({ success: true })

    } catch (err) {
        // Erreur lors de la vérification du token
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})

/**
 * PUT /api/products/:id
 * Met à jour les informations d'un produit (nom, description, prix)
 * Nécessite un token JWT valide d'administrateur
 */
router.put('/api/products/:id', async (req, res) => {
    console.log('body reçu:', req.body)
    // Récupérer et vérifier le token JWT
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        // Vérifier la validité du token et les droits admin
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        // Récupérer l'ID du produit et les nouvelles informations
        const { id } = req.params
        const { name, description, price } = req.body

        // Mettre à jour les informations du produit dans la base de données
        await pool.query(
            'UPDATE product SET name = $1, description = $2, price = $3 WHERE id = $4',
            [name, description, price, id]
        )

        res.json({ success: true })

    } catch (err) {
        // Erreur lors de la vérification du token
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})

/**
 * DELETE /api/products/:id
 * Supprime un produit de la base de données
 * Nécessite un token JWT valide d'administrateur
 */
router.delete('/api/products/:id', async (req, res) => {
    // Récupérer et vérifier le token JWT
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        // Vérifier la validité du token et les droits admin
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        // Récupérer l'ID du produit à supprimer
        const { id } = req.params

        // Supprimer le produit de la base de données
        await pool.query('DELETE FROM product WHERE id = $1', [id])

        res.json({ success: true })

    } catch (err) {
        // Erreur lors de la vérification du token
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})

// Exporter le routeur pour l'utiliser dans l'application principale
export default router