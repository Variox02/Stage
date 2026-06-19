import express from 'express'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Route pour créer une session Stripe Checkout
// - Vérifie le token JWT en cookie pour s'assurer que l'utilisateur est connecté
// - Construit les `line_items` à partir du panier fourni côté client
// - Ajoute les frais de livraison en tant qu'article séparé si nécessaire

router.post('/api/create-checkout-session', async (req, res) => {
    // Vérifie la présence du token d'authentification
    const token = req.cookies.token
    if (!token) return res.status(401).json({ error: 'Non connecté' })

    try {
        // Vérification simple du token (lancer une erreur si invalide)
        jwt.verify(token, process.env.JWT_SECRET)

        // Données envoyées depuis le front : articles et frais de livraison
        const { items, deliveryCost } = req.body

        // Construction des line_items pour Stripe à partir du panier
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'eur',
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        // Si des frais de livraison sont présents, on les ajoute comme ligne séparée
        if (deliveryCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Frais de livraison' },
                    unit_amount: Math.round(deliveryCost * 100)
                },
                quantity: 1
            })
        }

        // Création de la session Checkout côté Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/order.html`
        })

        // Retourne l'URL où rediriger le client
        res.json({ url: session.url })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Erreur serveur' })
    }
})

export default router