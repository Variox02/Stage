//Fonction JS de back pour afficher et edit le profil
import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

//Récupération des infos utilisateurs
router.get('/api/getUser', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        const result = await pool.query('SELECT first_name, name, email, address, country, isadmin, isdelivery, newsletter, create_date FROM utilisateur WHERE id = $1', [id])

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' })
        }

        res.json({ user: result.rows[0] })

    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

//Modification de mot de passe 
router.put('/api/updatePassword', async (req, res) => {

    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    const { old_password, new_password } = req.body

    if (!old_password || !new_password) {
        return res.status(400).json({ error: 'Champs manquants' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        const result = await pool.query('SELECT password FROM utilisateur WHERE id = $1', [id])
        if(result.rowCount === 0){
            return res.status(404).json({ error: "Utilisateur introuvable"})
        }
        const match = await bcrypt.compare(old_password, result.rows[0].password)

        if(!match){
            return res.status(401).json({ error: "Mot de passe incorrect" })
        }

        const hashed = await bcrypt.hash(new_password, 10)

        await pool.query('UPDATE utilisateur SET password = $1 WHERE id = $2', [hashed, id])

        res.json({ succes: true })

    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }
})

//Modif des infos personnels du user
router.put('/api/updateUser', async (req, res) => {
    const token = req.cookies.token
    
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }
    const changes = req.body

    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ error: 'Aucune donnée à mettre à jour' })
    }

    const allowedFields = ['first_name', 'name', 'email', 'country', 'address', 'newsletter']
    const fields = Object.keys(changes).filter(key => allowedFields.includes(key))

    if (fields.length === 0) {
        return res.status(400).json({ error: 'Aucun champ valide' })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

        //Merci Claude pour le coup de main là dessus
        const setChanges = fields.map((field, i) => `${field} = $${i + 1}`).join(', ')
        const values = fields.map(field => {
            const value = changes[field]
            return value === '' ? null : value
        })
        values.push(id)

        const query = `UPDATE utilisateur SET ${setChanges} WHERE id = $${fields.length + 1} RETURNING *`

        const result = await pool.query(query, values)

        res.json({ success: true, user: result.rows[0] })

    } catch (err) {
        console.error(err)
        return res.status(401).json({ error: 'Token invalide ou expiré' })
    }

})

router.get('/api/getCommandes', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id

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