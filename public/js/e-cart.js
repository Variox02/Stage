export function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || []
}

export function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart))
    updateCartBadge()
    renderCart()
}

export function addToCart(item) {
    const cart = getCart()
    const existing = cart.find(p => p.id === item.id)

    if (existing) {
        existing.quantity += 1
    } else {
        cart.push({ ...item, quantity: 1 })
    }
    saveCart(cart)
}

export function removeFromCart(id) {
    const cart = getCart().filter(p => p.id !== id)
    saveCart(cart)
}

export function updateQuantity(id, delta) {
    const cart = getCart()
    const item = cart.find(p => p.id === id)
    if (!item) return

    item.quantity += delta
    if (item.quantity <= 0) {
        return removeFromCart(id)
    }
    saveCart(cart)
}

export function updateCartBadge() {
    const cart = getCart()
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    const badge = document.getElementById('cart-badge')

    if (badge) {
        badge.textContent = total
        badge.style.display = total > 0 ? 'inline-block' : 'none'
    }
}

export function renderCart() {
    const container = document.getElementById('cart-items')
    const totalEl = document.getElementById('cart-total')
    if (!container) return

    const cart = getCart()

    if (!cart.length) {
        container.innerHTML = `<p class="text-center text-muted py-4">Votre panier est vide.</p>`
        totalEl.textContent = '0.00 €'
        return
    }

    container.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <div class="fw-bold">${item.name}</div>
                <small class="text-muted">${item.price.toFixed(2)} € / unité</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-secondary qty-btn" data-id="${item.id}" data-delta="-1">−</button>
                <span>${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary qty-btn" data-id="${item.id}" data-delta="1">+</button>
                <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${item.id}">🗑️</button>
            </div>
        </div>
    `).join('')

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    totalEl.textContent = total.toFixed(2) + ' €'

    container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, parseInt(btn.dataset.delta)))
    })

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id))
    })
}