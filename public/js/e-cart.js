// Module de gestion du panier
// Ce fichier exporte les fonctions pour gérer l'ajout, suppression et affichage des articles du panier
// Les données du panier sont stockées dans localStorage du navigateur

// Récupère le panier stocké dans localStorage
// Retourne un tableau vide si aucun panier n'existe
export function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || []
}

// Sauvegarde le panier dans localStorage et met à jour l'affichage
// Appelle updateCartBadge() et renderCart() pour synchroniser l'interface
export function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart))
    updateCartBadge()
    renderCart()
}

// Ajoute un article au panier ou incrémente sa quantité s'il existe déjà
// param item : l'objet produit à ajouter (doit contenir au minimum id, name, price)
export function addToCart(item) {
    const cart = getCart()
    const existing = cart.find(p => p.id === item.id)

    if (existing) {
        // L'article existe déjà : augmente la quantité
        existing.quantity += 1
    } else {
        // Nouvel article : l'ajoute avec quantité initiale de 1
        cart.push({ ...item, quantity: 1 })
    }
    saveCart(cart)
}

// Supprime complètement un article du panier par son ID
// param id : l'identifiant unique du produit à supprimer
export function removeFromCart(id) {
    const cart = getCart().filter(p => p.id !== id)
    saveCart(cart)
}

// Modifie la quantité d'un article
// param id : l'identifiant de l'article
// param delta : le changement de quantité (+1 ou -1)
// Si la quantité atteint 0 ou moins, l'article est supprimé
export function updateQuantity(id, delta) {
    const cart = getCart()
    const item = cart.find(p => p.id === id)
    if (!item) return

    item.quantity += delta
    // Supprime l'article si la quantité devient négative ou nulle
    if (item.quantity <= 0) {
        return removeFromCart(id)
    }
    saveCart(cart)
}

// Met à jour le badge du panier (nombre total d'articles)
// Affiche le nombre total d'articles dans le coin du bouton panier
export function updateCartBadge() {
    const cart = getCart()
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    const badge = document.getElementById('cart-badge')

    if (badge) {
        badge.textContent = total
        // Masque le badge si le panier est vide
        badge.style.display = total > 0 ? 'inline-block' : 'none'
    }
}

// Affiche le contenu du panier dans le modal
// Génère une liste avec les articles, leurs quantités et les boutons de gestion
// Calcule et affiche le total du panier
export function renderCart() {
    const container = document.getElementById('cart-items')
    const totalEl = document.getElementById('cart-total')
    if (!container) return

    const cart = getCart()

    // Affiche un message si le panier est vide
    if (!cart.length) {
        container.innerHTML = `<p class="text-center text-muted py-4">Votre panier est vide.</p>`
        totalEl.textContent = '0.00 €'
        return
    }

    // Génère le HTML pour chaque article du panier
    container.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <div class="fw-bold">${item.name}</div>
                <small class="text-muted">${item.price.toFixed(2)} € / unité</small>
            </div>
            <div class="d-flex align-items-center gap-2">
                <!-- Boutons pour augmenter/diminuer la quantité -->
                <button class="btn btn-sm btn-outline-secondary qty-btn" data-id="${item.id}" data-delta="-1">−</button>
                <span>${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary qty-btn" data-id="${item.id}" data-delta="1">+</button>
                <!-- Bouton pour supprimer l'article -->
                <button class="btn btn-sm btn-outline-danger remove-btn" data-id="${item.id}">🗑️</button>
            </div>
        </div>
    `).join('')

    // Calcule et affiche le total
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    totalEl.textContent = total.toFixed(2) + ' €'

    // Attache les événements click aux boutons de quantité
    container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, parseInt(btn.dataset.delta)))
    })

    // Attache les événements click aux boutons de suppression
    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id))
    })

}

//Bouton de check si connecté pour rediriger vers la page de commande ou de connexion
export async function initCheckoutBtn() {
    document.getElementById('cart-checkout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault()

        const { getUser } = await import('./e-checkcookie.js')
        const user = await getUser()

        if (!user) {
            window.location.href = 'connexion.html'
            return
        }

        window.location.href = 'order.html'
    })
}