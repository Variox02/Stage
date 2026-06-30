import { API_URL } from './e-config.js'
// Identifiant de la livraison actuellement consultée dans la modal
let currentDeliveryId = null

// Récupère la liste des livraisons côté serveur et met à jour l'UI
async function commandlist() {
    try {
        const response = await fetch(`${API_URL}/api/deliverylist`, {
            method: 'GET',
            credentials: 'include'
        })

        if (!response.ok) throw new Error('Erreur lors de la récupération des livraisons')

        // Tableau d'objets delivery reçu depuis l'API
        const deliveries = await response.json()
        const grid = document.getElementById('delivery-grid')
        grid.innerHTML = ''

        document.getElementById('delivery-spinner').classList.add('d-none')

        if (!deliveries.length) {
            document.getElementById('delivery-empty').classList.remove('d-none')
        } else {
            document.getElementById('delivery-empty').classList.add('d-none')
        }

        // Génération des cartes de livraison dynamiquement
        deliveries.forEach(d => {
            const isPris = d.id_delivery !== null
            const col = document.createElement('div')
            col.className = 'col-md-6 col-lg-4'
            col.innerHTML = `
                <div class="admin-card h-100">
                    <h5 class="admin-card-title mb-2">📦 Commande #${d.id_commande}</h5>
                    <p class="admin-product-desc mb-3">${d.delivery_address}</p>
                    <p class="admin-product-desc mb-3">${new Date(d.date_delivery).toLocaleString('fr-FR')}</p>
                    <button class="btn ${isPris ? 'btn-outline-secondary' : 'btn-rouge'} w-100 btn-view-delivery"
                        data-id="${d.id}"
                        data-id-commande="${d.id_commande}"
                        data-pris="${isPris}"
                        data-address="${d.delivery_address}"
                        data-price="${d.price}"
                        data-client="${d.first_name} ${d.name}"
                        data-telephone="${d.telephone}"
                        >
                        ${isPris ? '🛵 Déjà prise en charge' : 'Voir le détail'}
                    </button>
                </div>
            `
            grid.appendChild(col)
        })

        // Mise à jour des statistiques visibles en haut de la page
        const pris = deliveries.filter(d => d.id_delivery !== null).length
        document.getElementById('stat-total').textContent = deliveries.length
        document.getElementById('stat-pris').textContent = pris

        // Gestionnaire pour ouvrir la modal de détail
        // Ouvre la modal de détail quand on clique sur une carte
        document.querySelectorAll('.btn-view-delivery').forEach(btn => {
            btn.addEventListener('click', () => {
                currentDeliveryId = btn.dataset.id
                document.getElementById('detail-order-id').textContent = `#${btn.dataset.idCommande}`
                document.getElementById('detail-address').textContent = btn.dataset.address || '—'
                document.getElementById('detail-phone').textContent = btn.dataset.telephone || 'Non renseigné'
                document.getElementById('detail-total').textContent = parseFloat(btn.dataset.price).toFixed(2) + ' €'

                const isPris = btn.dataset.pris === 'true'
                document.getElementById('btn-take-delivery').classList.toggle('d-none', isPris)
                document.getElementById('btn-cancel-delivery').classList.toggle('d-none', !isPris)

                bootstrap.Modal.getOrCreateInstance(document.getElementById('orderDetailModal')).show()
            })
        })

    } catch (error) {
        console.error(error)
        document.getElementById('delivery-spinner').classList.add('d-none')
        const err = document.getElementById('delivery-error')
        err.textContent = 'Impossible de charger les livraisons.'
        err.classList.remove('d-none')
    }
}

// Prise en charge d'une livraison : envoie une requête PUT à l'API
document.getElementById('btn-take-delivery').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/api/deliverylist/${currentDeliveryId}/take`, {
            method: 'PUT',
            credentials: 'include'
        })

        if (!res.ok) throw new Error()

        // Ferme la modal et recharge la liste pour refléter la prise en charge
        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide()
        commandlist()

    } catch {
        alert('Erreur lors de la prise en charge de la commande')
    }
})

document.getElementById('btn-cancel-delivery').addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/api/deliverylist/${currentDeliveryId}/cancel`, {
            method: 'PUT',
            credentials: 'include'
        })

        if (!res.ok) throw new Error()

        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide()
        commandlist()

    } catch {
        alert('Erreur lors de l\'annulation de la prise en charge')
    }
})

// Chargement initial de la liste des livraisons au chargement de la page
commandlist()
