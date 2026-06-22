import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import PDFDocument from 'pdfkit'

const router = express.Router()

router.get('/api/facture/:id', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id_user = decoded.id
        const { id } = req.params

        // Récupérer la commande
        const cmdResult = await pool.query(
            'SELECT * FROM commande WHERE id = $1 AND id_user = $2',
            [id, id_user]
        )

        if (cmdResult.rowCount === 0) {
            return res.status(404).json({ error: 'Commande introuvable' })
        }

        const commande = cmdResult.rows[0]

        // Récupérer les lignes de commande avec les noms de produits
        const lignesResult = await pool.query(`
            SELECT lc.quantity, lc.price_unit, p.name
            FROM ligne_commande lc
            JOIN product p ON p.id = lc.id_product
            WHERE lc.id_commande = $1
        `, [id])

        const lignes = lignesResult.rows

        // Récupérer les infos de l'utilisateur
        const userResult = await pool.query(
            'SELECT first_name, name, email, address FROM utilisateur WHERE id = $1',
            [id_user]
        )
        const user = userResult.rows[0]

        // Générer le PDF
        const doc = new PDFDocument({ margin: 50 })

        res.setHeader('Content-Type', '../public/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=facture-${id}.pdf`)
        doc.pipe(res)

        // En-tête
        doc.fontSize(24).font('Helvetica-Bold').text('Fournaise', { align: 'left' })
        doc.fontSize(10).font('Helvetica').fillColor('#8C6B50')
            .text('Pizzeria artisanale depuis 2010', { align: 'left' })
            .text('10 Rue des Automnes, 99099 Mars', { align: 'left' })
            .text('00 00 00 00 00', { align: 'left' })
        
        doc.moveDown(2)

        // Titre facture
        doc.fillColor('#C8352A').fontSize(18).font('Helvetica-Bold')
            .text(`FACTURE #${id}`, { align: 'right' })
        doc.fillColor('#8C6B50').fontSize(10).font('Helvetica')
            .text(`Date : ${new Date(commande.create_date).toLocaleDateString('fr-FR')}`, { align: 'right' })

        doc.moveDown(2)

        // Infos client
        doc.fillColor('#2E1A0E').fontSize(11).font('Helvetica-Bold').text('Facturé à :')
        doc.fontSize(10).font('Helvetica')
            .text(`${user.first_name} ${user.name}`)
            .text(user.email)
            .text(user.address || 'Adresse non renseignée')

        doc.moveDown(2)

        // Ligne séparatrice
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#EAD9BB').stroke()
        doc.moveDown(0.5)

        // En-têtes tableau
        doc.fillColor('#2E1A0E').fontSize(10).font('Helvetica-Bold')
        doc.text('Produit', 50, doc.y, { width: 250 })
        doc.text('Qté', 300, doc.y - doc.currentLineHeight(), { width: 80, align: 'center' })
        doc.text('Prix unit.', 380, doc.y - doc.currentLineHeight(), { width: 80, align: 'center' })
        doc.text('Total', 460, doc.y - doc.currentLineHeight(), { width: 80, align: 'right' })

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#EAD9BB').stroke()
        doc.moveDown(0.5)

        // Lignes produits
        doc.font('Helvetica').fontSize(10).fillColor('#2E1A0E')
        lignes.forEach(ligne => {
            const lineTotal = ligne.quantity * ligne.price_unit
            const y = doc.y
            doc.text(ligne.name, 50, y, { width: 250 })
            doc.text(ligne.quantity.toString(), 300, y, { width: 80, align: 'center' })
            doc.text(`${parseFloat(ligne.price_unit).toFixed(2)} €`, 380, y, { width: 80, align: 'center' })
            doc.text(`${lineTotal.toFixed(2)} €`, 460, y, { width: 80, align: 'right' })
            doc.moveDown(0.75)
        })

        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#EAD9BB').stroke()
        doc.moveDown(0.5)

        // Livraison
        const deliveryCost = commande.delivery ? 2.50 : 0
        if (deliveryCost > 0) {
            const y = doc.y
            doc.text('Frais de livraison', 50, y, { width: 250 })
            doc.text('1', 300, y, { width: 80, align: 'center' })
            doc.text('2.50 €', 380, y, { width: 80, align: 'center' })
            doc.text('2.50 €', 460, y, { width: 80, align: 'right' })
            doc.moveDown(0.75)
        }

        // Total
        doc.moveDown(0.5)
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#C8352A')
        doc.text(`TOTAL : ${parseFloat(commande.price).toFixed(2)} €`, { align: 'right' })

        // Pied de page
        doc.moveDown(3)
        doc.fontSize(9).font('Helvetica').fillColor('#8C6B50')
            .text('Merci pour votre commande ! — Fournaise, pizzeria artisanale depuis 2010.', { align: 'center' })

        doc.end()

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

router.get('/api/lastCommande', async (req, res) => {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const result = await pool.query(
            'SELECT id FROM commande WHERE id_user = $1 ORDER BY create_date DESC LIMIT 1',
            [decoded.id]
        )
        if (result.rowCount === 0) return res.status(404).json({ error: 'Aucune commande' })
        res.json({ id: result.rows[0].id })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router