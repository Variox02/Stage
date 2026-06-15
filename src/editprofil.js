// Backend router pour récupérer et modifier les informations du profil utilisateur.
// Ce fichier expose des routes protégées par JWT et utilise la base de données PostgreSQL.

import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

// -----------------------------------------------------------
// Route protégée : récupération des informations du profil
// -----------------------------------------------------------
router.get('https://stage.onrender.com/api/getUser', async (req, res) => {
    // Le token d'authentification est stocké dans le cookie 'token'.
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        // Vérifie le token JWT et récupère l'identifiant utilisateur.
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        // Récupère les champs du profil qui pourront être affichés côté client.
        const result = await pool.query(
            'SELECT first_name, name, email, address, country, isadmin, isdelivery, newsletter, create_date FROM utilisateur WHERE id = $1',
            [id]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' })
        }

        // Retourne l'objet user pour affichage du profil.
        res.json({ user: result.rows[0] })

    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

// -----------------------------------------------------------
// Route protégée : modification du mot de passe utilisateur
// -----------------------------------------------------------
router.put('https://stage.onrender.com/api/updatePassword', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    const { old_password, new_password } = req.body

    // Vérifie que les deux champs attendus sont présents.
    if (!old_password || !new_password) {
        return res.status(400).json({ error: 'Champs manquants' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        // Récupère le hash actuel du mot de passe depuis la base.
        const result = await pool.query('SELECT password FROM utilisateur WHERE id = $1', [id])
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' })
        }

        // Vérifie que l'ancien mot de passe fourni correspond au hash stocké.
        const match = await bcrypt.compare(old_password, result.rows[0].password)
        if (!match) {
            return res.status(401).json({ error: 'Mot de passe incorrect' })
        }

        // Hash le nouveau mot de passe avant mise à jour.
        const hashed = await bcrypt.hash(new_password, 10)

        await pool.query('UPDATE utilisateur SET password = $1 WHERE id = $2', [hashed, id])

        res.json({ succes: true })

    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

// -----------------------------------------------------------
// Route protégée : mise à jour des informations utilisateur
// -----------------------------------------------------------
router.put('https://stage.onrender.com/api/updateUser', async (req, res) => {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    const changes = req.body

    // Empêche la requête vide sans difficultés.
    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })
    }

    // Liste des champs autorisés à être modifiés par le client.
    const allowedFields = ['first_name', 'name', 'email', 'country', 'address', 'newsletter']
    const fields = Object.keys(changes).filter(key => allowedFields.includes(key))

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Aucun champ valide' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        // Crée dynamiquement la clause SET pour la requête UPDATE.
        // Par exemple : 'first_name = $1, email = $2'.
        const setChanges = fields.map((field, i) => `${field} = $${i + 1}`).join(', ')

        // Remplace les chaînes vides par NULL pour permettre la désactivation d'un champ.
        const values = fields.map(field => {
            const value = changes[field]
            return value === '' ? null : value
        })

        // Ajoute l'id de l'utilisateur comme dernier paramètre.
        values.push(id)

        const query = `UPDATE utilisateur SET ${setChanges} WHERE id = $${fields.length + 1} RETURNING *`
        const result = await pool.query(query, values)

        // Renvoie les informations mises à jour pour synchroniser le client.
        res.json({ success: true, user: result.rows[0] })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

// -----------------------------------------------------------
// Route protégée : récupération des commandes passées par l'utilisateur
// -----------------------------------------------------------
router.get('https://stage.onrender.com/api/getCommandes', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        // Requête pour rassembler les lignes de commande et les informations produit.
        // Utilise json_agg et json_build_object pour passer une structure JSON vers le client.
        const result = await pool.query(`
            SELECT
                c.id AS commande_id,
                c.create_date,
                c.price,
                c.id_delivery,
                json_agg(
                    json_build_object(
                        'product_name', p.name,
                        'quantity', lc.quantity,
                        'price_unit', lc.price_unit
                    )
                ) AS lignes
            FROM commande c
            JOIN ligne_commande lc ON lc.id_commande = c.id
            JOIN product p ON p.id = lc.id_product
            WHERE c.id_user = $1
            GROUP BY c.id, c.create_date, c.price, c.id_delivery
            ORDER BY c.create_date DESC
        `, [id])

        res.json({ commandes: result.rows })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

export default router
