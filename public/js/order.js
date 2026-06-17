import { checkAuth } from './e-navbar.js'
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

document.addEventListener('DOMContentLoaded', checkAuth)

