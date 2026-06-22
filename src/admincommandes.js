import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

// Routes d'administration pour la gestion des commandes
// Fournit :
// - GET /api/orders         : liste des commandes (avec statut)
// - GET /api/orders/:id     : détail d'une commande (incl. articles)
// - PUT /api/orders/:id/done: marque une commande comme terminée
// Toutes les routes vérifient la présence d'un token JWT administrateur

const router = express.Router()

// GET /api/orders
// - Retourne la liste des commandes triées par id décroissant
// - Joint les informations de livraison si présentes (LEFT JOIN)
router.get('/api/orders', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const result = await pool.query(
            `SELECT c.id, c.create_date, c.price, c.delivery, c.isdone,
                    d.isdelivered
             FROM commande c
             LEFT JOIN delivery d ON d.id_commande = c.id
             ORDER BY c.id DESC`
        )
        res.json(result.rows)

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})

/**
 * GET /api/orders/:id
 * Détail d'une commande (articles inclus)
 * Nécessite un token JWT valide d'administrateur
 */
// GET /api/orders/:id
// - Renvoie le détail d'une commande spécifique ainsi que ses articles
// - La route retourne 404 si la commande n'existe pas
router.get('/api/orders/:id', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const { id } = req.params

        // Récupère les informations générales de la commande
        const commandeResult = await pool.query(
            `SELECT c.id, c.create_date, c.price, c.delivery, c.isdone, d.isdelivered
             FROM commande c
             LEFT JOIN delivery d ON d.id_commande = c.id
             WHERE c.id = $1`,
            [id]
        )

        if (commandeResult.rowCount === 0) {
            return res.status(404).json({ error: 'Commande introuvable' })
        }

        // Récupère les lignes de commande (articles et quantités)
        const itemsResult = await pool.query(
            `SELECT p.name, lc.quantity, lc.price_unit
             FROM ligne_commande lc
             JOIN product p ON p.id = lc.id_product
             WHERE lc.id_commande = $1`,
            [id]
        )

        res.json({
            ...commandeResult.rows[0],
            items: itemsResult.rows
        })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})

/**
 * PUT /api/orders/:id/done
 * Marque une commande comme terminée
 * Nécessite un token JWT valide d'administrateur
 */
// PUT /api/orders/:id/done
// - Marque une commande comme "terminée" (isdone = true)
// - Utilisé par l'interface d'administration après validation
router.put('/api/orders/:id/done', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const { id } = req.params
        // Mise à jour simple du flag isdone
        await pool.query('UPDATE commande SET isdone = true WHERE id = $1', [id])

        res.json({ success: true })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide' })
    }
})



// Export du routeur pour l'intégration dans l'app principale
export default router