import { getEmojiForPizza } from './e-utils.js'

/**
 * Fonction principale qui affiche la liste des produits avec les options de gestion du stock
 * Cette fonction récupère les produits depuis l'API et les affiche dans un tableau
 * Elle gère également l'édition, la suppression et la mise à jour du stock
 */
async function printProducts(){
    try {
        // Récupération des produits depuis l'API
        const response = await fetch('https://stage-ydwe.onrender.com/api/products')
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits')
        }
        const products = await response.json()
        const tbody = document.getElementById('stock-tbody')
        // Masquer le spinner de chargement
        document.getElementById('stock-spinner').classList.add('d-none')

        // Parcourir chaque produit et créer une ligne de tableau
        products.forEach(p => {
            const stock = parseInt(p.stock)
            // Déterminer la classe CSS du badge selon le niveau de stock
            let badgeClass = 'admin-stock-ok'
            if (stock === 0) {
                badgeClass = 'admin-stock-rupture'  // Stock épuisé
            } else if (stock <= 3) {
                badgeClass = 'admin-stock-low'  // Stock faible
            }

            // Créer une nouvelle ligne du tableau avec les informations du produit
            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td class="text-center fs-4">${getEmojiForPizza(p.name)}</td>
                <td><span class="admin-product-name">${p.name}</span></td>
                <td><span class="admin-product-desc">${p.description || '—'}</span></td>
                <td class="text-center"><span class="admin-price">${parseFloat(p.price).toFixed(2)} €</span></td>
                <td class="text-center"><span class="admin-stock-badge ${badgeClass}" id="badge-${p.id}">${stock}</span></td>
                <td class="text-center">
                    <!-- Boutons pour augmenter/diminuer la quantité du stock -->
                    <div class="admin-qty-wrap">
                        <button class="admin-qty-btn" data-id="${p.id}" data-delta="-1">−</button>
                        <input class="admin-qty-input" type="number" value="${stock}" min="0" id="input-${p.id}" />
                        <button class="admin-qty-btn" data-id="${p.id}" data-delta="1">+</button>
                    </div>
                </td>
                <td class="text-center">
                    <!-- Bouton pour ouvrir le formulaire de modification du produit -->
                    <button class="admin-btn-edit" data-id="${p.id}" data-name="${p.name}" data-description="${p.description || ''}" data-price="${p.price}">
                        ✏️ Modifier
                    </button>
                </td>
            `
            tbody.appendChild(tr)
        })
        
        // Variable pour stocker l'ID du produit en cours de modification
        let currentEditId = null

        // Gestionnaire de clic pour les boutons "Modifier"
        // Remplit le formulaire modal avec les données du produit sélectionné
        document.querySelectorAll('.admin-btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                currentEditId = btn.dataset.id
                document.getElementById('edit-name').value = btn.dataset.name
                document.getElementById('edit-description').value = btn.dataset.description
                document.getElementById('edit-price').value = parseFloat(btn.dataset.price).toFixed(2)

                new bootstrap.Modal(document.getElementById('editProductModal')).show()
            })
        })

        // Gestionnaire pour sauvegarder les modifications du produit
        document.getElementById('btn-save-product').addEventListener('click', async () => {
            const name = document.getElementById('edit-name').value
            const description = document.getElementById('edit-description').value
            const price = document.getElementById('edit-price').value

            try {
                // Envoyer une requête PUT pour mettre à jour le produit
                const res = await fetch(`https://stage-ydwe.onrender.com/api/products/${currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, description, price })
                })

                if (!res.ok) throw new Error()

                // Fermer la modal et rafraîchir le tableau
                bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide()
                printProducts()  // recharge le tableau

            } catch {
                alert('Erreur lors de la modification du produit')
            }
        })

        // Gestionnaire pour supprimer un produit
        document.getElementById('btn-delete-product').addEventListener('click', async () => {
            // Demander une confirmation avant de supprimer
            if (!confirm('Supprimer ce produit définitivement ?')) return

            try {
                // Envoyer une requête DELETE pour supprimer le produit
                const res = await fetch(`https://stage-ydwe.onrender.com/api/products/${currentEditId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                })

                if (!res.ok) throw new Error()

                // Fermer la modal et rafraîchir le tableau
                bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide()
                printProducts()

            } catch {
                alert('Erreur lors de la suppression du produit')
            }
        })
        
        // ========== CALCUL DES STATISTIQUES DE STOCK ==========
        const total = products.length  // Nombre total de produits
        const dispo = products.filter(p => parseInt(p.stock) > 3).length  // Produits en stock
        const low = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= 3).length  // Stock faible
        const rupture = products.filter(p => parseInt(p.stock) === 0).length  // Stock épuisé

        // Injecter les statistiques dans les cartes du tableau de bord
        document.getElementById('stat-total').textContent = total
        document.getElementById('stat-dispo').textContent = dispo
        document.getElementById('stat-low').textContent = low
        document.getElementById('stat-rupture').textContent = rupture
        
        // Gestionnaire pour les boutons +/- de modification du stock
        document.querySelectorAll('.admin-qty-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id
                const display = document.getElementById(`input-${id}`)
                // Calculer la nouvelle valeur (minimum 0)
                const newVal = Math.max(0, parseInt(display.value) + parseInt(btn.dataset.delta))

                try {
                    // Envoyer une requête PUT pour mettre à jour le stock
                    const res = await fetch(`https://stage-ydwe.onrender.com/api/products/${id}/stock`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ stock: newVal })
                    })

                    if (!res.ok) throw new Error()

                    // Mettre à jour l'affichage avec la nouvelle valeur
                    display.value = newVal
                    const badge = document.getElementById(`badge-${id}`)
                    badge.textContent = newVal
                    // Réinitialiser et appliquer la classe CSS appropriée selon le niveau de stock
                    badge.className = 'admin-stock-badge'
                    if (newVal === 0) badge.classList.add('admin-stock-rupture')
                    else if (newVal <= 3) badge.classList.add('admin-stock-low')
                    else badge.classList.add('admin-stock-ok')
                    updateStats()  

                } catch {
                    alert('Erreur lors de la mise à jour du stock')
                }
            })
        })

    } catch (error) {
        // Gestion des erreurs : masquer le spinner et afficher un message d'erreur
        console.error(error)
        document.getElementById('stock-spinner').classList.add('d-none')
        const err = document.getElementById('stock-error')
        err.textContent = 'Impossible de charger les produits.'
        err.classList.remove('d-none')
    }
    printproducts() 
}

// Lancer la fonction au chargement de la page
printProducts()

function updateStats() {
    const badges = document.querySelectorAll('.admin-stock-badge')
    let total = badges.length
    let dispo = 0, low = 0, rupture = 0

    badges.forEach(badge => {
        const val = parseInt(badge.textContent)
        if (val === 0) rupture++
        else if (val <= 3) low++
        else dispo++
    })

    document.getElementById('stat-total').textContent = total
    document.getElementById('stat-dispo').textContent = dispo
    document.getElementById('stat-low').textContent = low
    document.getElementById('stat-rupture').textContent = rupture
}