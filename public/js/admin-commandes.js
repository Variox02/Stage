import { API_URL } from './e-config.js'
import { isAdmin } from './e-checkcookie.js'

if (!isAdmin()) {
    window.location.href = '/admin/login.html'
}

let currentOrderId = null
let currentFilter = 'all'
let allOrders = []


// Affiche la grille des commandes pour l'administration
// - Récupère la liste via GET /api/orders
// - Génère les cartes de commande, met à jour les stats et ajoute les listeners
async function printOrders() {
    try {
        const response = await fetch(`${API_URL}/api/orders`, { credentials: 'include' })
        if (!response.ok) throw new Error('Erreur lors de la récupération des commandes')

        const orders = await response.json()
        allOrders = orders
        const grid = document.getElementById('orders-grid')
        grid.innerHTML = ''
        document.getElementById('orders-spinner').classList.add('d-none')

        // Filtrage côté client selon le bouton actif (Toutes / En préparation / Terminées)
        const filtered = orders.filter(o => {
            if (currentFilter === 'pending') return !o.isdone
            if (currentFilter === 'done') return o.isdone
            return true
        })

        document.getElementById('orders-empty').classList.toggle('d-none', filtered.length > 0)

        // Construction des cartes de commande affichées
        filtered.forEach(o => {
            const col = document.createElement('div')
            col.className = 'col-md-6 col-lg-4'

            let statusBadge = o.isdone
                ? '<span class="admin-stock-badge admin-stock-ok">✅ Terminée</span>'
                : '<span class="admin-stock-badge admin-stock-low">👨‍🍳 En préparation</span>'

            let modeLabel = o.delivery ? '🛵 Livraison' : '🏪 À emporter'
            if (o.delivery && o.isdelivered) modeLabel += ' (livrée)'

            col.innerHTML = `
                <div class="admin-card h-100">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="admin-card-title mb-0">📦 Commande #${o.id}</h5>
                        ${statusBadge}
                    </div>
                    <p class="admin-product-desc mb-1">${modeLabel}</p>
                    <p class="admin-product-desc mb-3">${new Date(o.create_date).toLocaleString('fr-FR')}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="fw-bold">Total</span>
                        <span class="admin-price">${parseFloat(o.price).toFixed(2)} €</span>
                    </div>
                    <button class="btn btn-rouge w-100 btn-view-order" data-id="${o.id}">
                        Voir le détail
                    </button>
                </div>
            `
            grid.appendChild(col)
        })

        // Stats générales (calculées sur l'ensemble des commandes, pas seulement celles filtrées)
        document.getElementById('stat-total').textContent = orders.length
        document.getElementById('stat-encours').textContent = orders.filter(o => !o.isdone).length
        document.getElementById('stat-terminees').textContent = orders.filter(o => o.isdone).length
        document.getElementById('stat-livraison').textContent = orders.filter(o => o.delivery && !o.isdelivered).length

        // Listener "Voir le détail"
        document.querySelectorAll('.btn-view-order').forEach(btn => {
            btn.addEventListener('click', () => openOrderDetail(btn.dataset.id))
        })

    } catch (error) {
        console.error(error)
        document.getElementById('orders-spinner').classList.add('d-none')
        const err = document.getElementById('orders-error')
        err.textContent = 'Impossible de charger les commandes.'
        err.classList.remove('d-none')
    }
}

// Ouvre le modal de détail d'une commande et charge ses informations
async function openOrderDetail(id) {
    currentOrderId = id
    document.getElementById('detail-order-id').textContent = `#${id}`

    try {
        const res = await fetch(`${API_URL}/api/orders/${id}`, { credentials: 'include' })
        const data = await res.json()

        let modeLabel = data.delivery ? '🛵 Livraison' : '🏪 À emporter'
        if (data.delivery && data.isdelivered) modeLabel += ' (déjà livrée)'
        document.getElementById('detail-mode').textContent = modeLabel

        document.getElementById('detail-total').textContent = parseFloat(data.price).toFixed(2) + ' €'

        const itemsList = document.getElementById('detail-items')
        itemsList.innerHTML = ''
        // Liste des articles composant la commande
        data.items.forEach(item => {
            const li = document.createElement('li')
            li.textContent = `${item.name} × ${item.quantity}`
            itemsList.appendChild(li)
        })

        const statusEl = document.getElementById('detail-status')
        if (data.isdone) {
            statusEl.textContent = '✅ Terminée'
            statusEl.className = 'admin-stock-badge admin-stock-ok'
        } else {
            statusEl.textContent = '👨‍🍳 En préparation'
            statusEl.className = 'admin-stock-badge admin-stock-low'
        }

        // Masque le bouton "Marquer comme terminée" si la commande est déjà terminée
        document.getElementById('btn-mark-done').classList.toggle('d-none', data.isdone)

    } catch (err) {
        console.error(err)
    }

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('orderDetailModal'))
    modal.show()
}

// Validation d'une commande depuis le modal : envoi d'une requête PUT pour marquer comme terminée
document.getElementById('btn-mark-done').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/api/orders/${currentOrderId}/done`, {
            method: 'PUT',
            credentials: 'include'
        })

        if (!res.ok) throw new Error()

        // Ferme le modal puis recharge la liste des commandes
        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide()
        printOrders()

    } catch {
        alert('Erreur lors de la validation de la commande')
    }
})

// Gestion des filtres (boutons en haut de la page)
document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('admin-filter-active'))
        btn.classList.add('admin-filter-active')
        currentFilter = btn.dataset.filter
        printOrders()
    })
})


// Calcule un score de pertinence : priorité à "commence par", puis "contient"
function matchScore(text, query) {
    if (text.startsWith(query)) return 2
    if (text.includes(query)) return 1
    return 0
}

// Affiche les 5 commandes les plus proches du numéro tapé, sous la barre
function showSearchResults(query) {
    const dropdown = document.getElementById('search-results')
    const q = query.trim().toLowerCase().replace('#', '')

    if (!q) {
        dropdown.classList.add('d-none')
        dropdown.innerHTML = ''
        return
    }

    const results = allOrders
        .map(o => {
            const idStr = String(o.id).toLowerCase()
            return { order: o, score: matchScore(idStr, q) }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

    if (results.length === 0) {
        dropdown.innerHTML = `<div class="search-result-item" style="color:var(--texte-muted); cursor:default;">Aucun résultat</div>`
        dropdown.classList.remove('d-none')
        return
    }

    dropdown.innerHTML = results.map(r => {
        const o = r.order
        const statusLabel = o.isdone ? '✅ Terminée' : '👨‍🍳 En préparation'
        return `
            <div class="search-result-item" data-id="${o.id}">
                Commande #${o.id}
                <span style="color:var(--texte-muted); font-size:.8rem;"> — ${statusLabel} — ${parseFloat(o.price).toFixed(2)} €</span>
            </div>
        `
    }).join('')

    dropdown.classList.remove('d-none')

    // Au clic sur un résultat → ouvre directement le détail de cette commande
    dropdown.querySelectorAll('.search-result-item[data-id]').forEach(item => {
        item.addEventListener('click', () => {
            dropdown.classList.add('d-none')
            document.getElementById('search-input').value = ''
            openOrderDetail(item.dataset.id)
        })
    })
}

// Écoute la saisie dans la barre de recherche
document.getElementById('search-input').addEventListener('input', (e) => {
    showSearchResults(e.target.value)
})

// Ferme le dropdown si on clique ailleurs sur la page
document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-input') && !e.target.closest('#search-results')) {
        document.getElementById('search-results').classList.add('d-none')
    }
})

printOrders()