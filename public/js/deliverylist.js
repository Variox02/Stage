let currentDeliveryId = null

async function commandlist() {
    try {
        const response = await fetch('https://stage-ydwe.onrender.com/api/deliverylist', {
            method: 'GET',
            credentials: 'include'
        })

        if (!response.ok) throw new Error('Erreur lors de la récupération des livraisons')

        const deliveries = await response.json()
        const grid = document.getElementById('delivery-grid')
        grid.innerHTML = ''

        document.getElementById('delivery-spinner').classList.add('d-none')

        if (!deliveries.length) {
            document.getElementById('delivery-empty').classList.remove('d-none')
        } else {
            document.getElementById('delivery-empty').classList.add('d-none')
        }

        deliveries.forEach(d => {
            const isPris = d.id_delivery !== null
            const col = document.createElement('div')
            col.className = 'col-md-6 col-lg-4'
            col.innerHTML = `
                <div class="admin-card h-100">
                    <h5 class="admin-card-title mb-2">📦 Commande #${d.id_commande}</h5>
                    <p class="admin-product-desc mb-3">${d.delivery_address}</p>
                    <p class="admin-product-desc mb-3">${new Date(d.date_delivery).toLocaleString('fr-FR')}</p>
                    <button class="btn ${isPris ? 'btn-outline-secondary' : 'btn-rouge'} w-100 btn-view-delivery" data-id="${d.id}" data-id-commande="${d.id_commande}" data-pris="${isPris}">
                        ${isPris ? '🛵 Déjà prise en charge' : 'Voir le détail'}
                    </button>
                </div>
            `
            grid.appendChild(col)
        })

        // Stats
        const pris = deliveries.filter(d => d.id_delivery !== null).length
        document.getElementById('stat-total').textContent = deliveries.length
        document.getElementById('stat-pris').textContent = pris

        // Gestionnaire pour ouvrir la modal de détail
        document.querySelectorAll('.btn-view-delivery').forEach(btn => {
            btn.addEventListener('click', () => {
                currentDeliveryId = btn.dataset.id
                document.getElementById('detail-order-id').textContent = `#${btn.dataset.idCommande}`

                const isPris = btn.dataset.pris === 'true'
                document.getElementById('btn-take-delivery').classList.toggle('d-none', isPris)
                document.getElementById('btn-cancel-delivery').classList.toggle('d-none', !isPris)

                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('orderDetailModal'))
                modal.show()
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

document.getElementById('btn-take-delivery').addEventListener('click', async () => {
    try {
        const res = await fetch(`https://stage-ydwe.onrender.com/api/deliverylist/${currentDeliveryId}/take`, {
            method: 'PUT',
            credentials: 'include'
        })

        if (!res.ok) throw new Error()

        bootstrap.Modal.getInstance(document.getElementById('orderDetailModal')).hide()
        commandlist()

    } catch {
        alert('Erreur lors de la prise en charge de la commande')
    }
})

commandlist()