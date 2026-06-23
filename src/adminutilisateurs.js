import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import nodemailer from 'nodemailer'

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


router.get('/api/newsletter/count', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const result = await pool.query(
            'SELECT COUNT(*) FROM utilisateur WHERE newsletter = true'
        )
        res.json({ count: parseInt(result.rows[0].count) })

    } catch (err) {
        console.error(err)
        res.status(401).json({ error: 'Token invalide' })
    }
})

router.post('/api/newsletter/send', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded.isadmin) return res.status(403).json({ error: 'Accès refusé' })

        const { subject, body } = req.body
        if (!subject || !body) return res.status(400).json({ error: 'Champs manquants' })

        // Récupère tous les emails avec newsletter = true
        const result = await pool.query(
            'SELECT email, first_name FROM utilisateur WHERE newsletter = true'
        )

        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Aucun abonné' })
        }

        // Config SMTP — à adapter selon ton provider
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })

        // Envoi à chaque abonné
        for (const user of result.rows) {
            await transporter.sendMail({
                from: `"Fournaise" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                        <h2 style="color:#C8352A;">Fournaise 🍕</h2>
                        <p>Bonjour ${user.first_name},</p>
                        <div style="white-space: pre-line;">${body}</div>
                        <hr style="border-color:#EAD9BB; margin-top:2rem;" />
                        <p style="color:#8C6B50; font-size:.8rem;">
                            Vous recevez cet email car vous êtes abonné à la newsletter Fournaise.<br/>
                            Pour vous désabonner, rendez-vous dans votre profil.
                        </p>
                    </div>
                `
            })
        }

        res.json({ success: true, sent: result.rowCount })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})



// Exporter le routeur pour l'utiliser dans l'application principale
// Export du routeur pour être monté dans l'application principale (e.g. app.use)
export default router