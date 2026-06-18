import { checkAuth } from './e-navbar.js'
import { addToCart, updateCartBadge, renderCart, CheckoutBtn } from './e-cart.js'
import { getUser } from './e-checkcookie.js'
import { getEmojiForPizza } from './e-utils.js'

function loadOrderItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    const container = document.getElementById('order-items')

    if (!cart.length) {
        container.innerHTML = `<p class="text-center py-3" style="color:var(--texte-muted);">Votre panier est vide.</p>`
        document.getElementById('btn-pay').disabled = true
        return
    }

    container.innerHTML = ''

    let subtotal = 0

    cart.forEach(item => {
        const lineTotal = item.price * item.quantity
        subtotal += lineTotal

        const div = document.createElement('div')
        div.className = 'order-item'
        div.innerHTML = `
            <div class="order-item-emoji">${getEmojiForPizza(item.name)}</div>
            <div class="order-item-info">
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-qty">× ${item.quantity}</span>
            </div>
            <span class="order-item-price">${lineTotal.toFixed(2)} €</span>
        `
        container.appendChild(div)
    })

    const deliveryCost = 2.50
    const total = subtotal + deliveryCost

    // Récap panier
    document.getElementById('order-subtotal').textContent = subtotal.toFixed(2) + ' €'
    document.getElementById('order-delivery-cost').textContent = deliveryCost.toFixed(2) + ' €'
    document.getElementById('order-total').textContent = total.toFixed(2) + ' €'

    // Récap paiement
    document.getElementById('pay-subtotal').textContent = subtotal.toFixed(2) + ' €'
    document.getElementById('pay-delivery').textContent = deliveryCost.toFixed(2) + ' €'
    document.getElementById('pay-total').textContent = total.toFixed(2) + ' €'
    document.getElementById('btn-pay-label').textContent = `Payer ${total.toFixed(2)} € avec Stripe`
}

loadOrderItems()

document.querySelectorAll('input[name="order-mode"]').forEach(delivery => {
    delivery.addEventListener('change', () => {
        // Mise à jour visuelle des cards
        document.querySelectorAll('.order-mode-card').forEach(c => c.classList.remove('order-mode-selected'))
        delivery.closest('.order-mode-card').classList.add('order-mode-selected')

        // Recalcul du total
        const cart = JSON.parse(localStorage.getItem('cart')) || []
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const deliveryCost = delivery.value === 'livraison' ? 2.50 : 0
        const total = subtotal + deliveryCost

        document.getElementById('order-delivery-cost').textContent = deliveryCost.toFixed(2) + ' €'
        document.getElementById('order-total').textContent = total.toFixed(2) + ' €'
        document.getElementById('pay-delivery').textContent = deliveryCost.toFixed(2) + ' €'
        document.getElementById('pay-total').textContent = total.toFixed(2) + ' €'
        document.getElementById('btn-pay-label').textContent = `Payer ${total.toFixed(2)} € avec Stripe`
    })
})

document.querySelector('#btn-pay').addEventListener('click', async () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || []
    if (!cart.length) {
        alert('Votre panier est vide.')
        return
    }

    const isDelivery = document.querySelector('input[name="order-mode"]:checked').value === 'livraison'
    const deliveryCost = isDelivery ? 2.50 : 0

    document.getElementById('btn-pay').disabled = true
    document.getElementById('btn-pay-label').textContent = 'Traitement...'

    try {
        const res = await fetch('https://stage-ydwe.onrender.com/api/commande', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items: cart, deliveryCost, delivery: isDelivery })
        })

        if (!res.ok) throw new Error()

        // Créer la session Stripe
        const stripeRes = await fetch('https://stage-ydwe.onrender.com/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items: cart, deliveryCost })
        })
        const data = await stripeRes.json()
        if (!stripeRes.ok) throw new Error(data.error)
        
        window.location.href = data.url

    } catch (err) {
        console.error(err)
        document.getElementById('order-error').textContent = 'Erreur lors de la commande.'
        document.getElementById('order-error').classList.remove('d-none')
        document.getElementById('btn-pay').disabled = false
        document.getElementById('btn-pay-label').textContent = 'Confirmer la commande'
    }
})

async function checkProfil() {
    const res = await getUser()
    const addressField = document.getElementById('order-address-display')
    if (res && res.address) {
        addressField.textContent = res.address
    } else {
        addressField.textContent = 'Adresse non renseignée. Veuillez mettre à jour votre profil.'
    }
}





document.addEventListener('DOMContentLoaded', () =>{
    checkAuth()
    renderCart()
    checkProfil()
})

