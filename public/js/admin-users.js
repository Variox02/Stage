import { API_URL } from './e-config.js'

let currentEditUserId = null
let allUsers = []

// Récupère et affiche la liste des utilisateurs côté administration
// - Appelle GET /api/users (cookie JWT envoyé via `credentials: 'include'`)
// - Construit les lignes du tableau, met à jour les statistiques
// - Prépare les listeners pour ouvrir le modal d'édition
async function printUsers() {
    try {
        const response = await fetch(`${API_URL}/api/users`, { credentials: 'include' })
        if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs')

        const users = await response.json()
        allUsers = users
        const tbody = document.getElementById('users-tbody')
        tbody.innerHTML = ''
        document.getElementById('users-spinner').classList.add('d-none')

        // Parcours des utilisateurs et insertion dans le DOM
        users.forEach(u => {
            const tr = document.createElement('tr')

            let roleLabel = '🙋 Client'
            if (u.isadmin && u.isdelivery) roleLabel = '🛠️🛵 Admin + Livreur'
            else if (u.isadmin) roleLabel = '🛠️ Admin'
            else if (u.isdelivery) roleLabel = '🛵 Livreur'

            tr.innerHTML = `
                <td><span class="admin-product-name">${u.first_name} ${u.name}</span></td>
                <td><span class="admin-product-desc">${u.email}</span></td>
                <td><span class="admin-product-desc">${u.telephone || '—'}</span></td>
                <td><span class="admin-product-desc">${u.address || '—'}</span></td>
                <td class="text-center"><span class="admin-stock-badge admin-stock-ok">${roleLabel}</span></td>
                <td class="text-center">
                    <button class="admin-btn-edit"
                        data-id="${u.id}"
                        data-first-name="${u.first_name}"
                        data-name="${u.name}"
                        data-email="${u.email}"
                        data-phone="${u.telephone || ''}"
                        data-address="${u.address || ''}"
                        data-isadmin="${u.isadmin}"
                        data-isdelivery="${u.isdelivery}">
                        ✏️ Modifier
                    </button>
                </td>
            `
            tbody.appendChild(tr)
        })

        // Mise à jour des statistiques affichées en haut de la page
        const total = users.length
        const livreurs = users.filter(u => u.isdelivery).length
        const admins = users.filter(u => u.isadmin).length
        const clients = users.filter(u => !u.isadmin && !u.isdelivery).length
        document.getElementById('stat-total').textContent = total
        document.getElementById('stat-livreurs').textContent = livreurs
        document.getElementById('stat-admins').textContent = admins
        document.getElementById('stat-clients').textContent = clients

        // Listener "Modifier" — recréé à chaque appel car le DOM est régénéré
        document.querySelectorAll('.admin-btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                currentEditUserId = btn.dataset.id
                document.getElementById('edit-user-first-name').value = btn.dataset.firstName
                document.getElementById('edit-user-name').value = btn.dataset.name
                document.getElementById('edit-user-email').value = btn.dataset.email
                document.getElementById('edit-user-phone').value = btn.dataset.phone
                document.getElementById('edit-user-address').value = btn.dataset.address
                document.getElementById('edit-user-isadmin').checked = btn.dataset.isadmin === 'true'
                document.getElementById('edit-user-isdelivery').checked = btn.dataset.isdelivery === 'true'

                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal'))
                modal.show()
            })
        })

    } catch (error) {
        console.error(error)
        document.getElementById('users-spinner').classList.add('d-none')
        const err = document.getElementById('users-error')
        err.textContent = 'Impossible de charger les utilisateurs.'
        err.classList.remove('d-none')
    }
}

// Enregistrement des changements apportés à un utilisateur via le modal
document.getElementById('btn-save-user').addEventListener('click', async () => {
    const first_name = document.getElementById('edit-user-first-name').value
    const name = document.getElementById('edit-user-name').value
    const email = document.getElementById('edit-user-email').value
    const telephone = document.getElementById('edit-user-phone').value
    const address = document.getElementById('edit-user-address').value
    const isadmin = document.getElementById('edit-user-isadmin').checked
    const isdelivery = document.getElementById('edit-user-isdelivery').checked

    try {
        const res = await fetch(`${API_URL}/api/users/${currentEditUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ first_name, name, email, telephone, address, isadmin, isdelivery })
        })

        if (!res.ok) throw new Error()

        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide()
        printUsers()

    } catch {
        // En cas d'erreur réseau ou serveur
        alert('Erreur lors de la modification de l\'utilisateur')
    }
})

// Suppression définitive d'un utilisateur (confirmation demandée)
document.getElementById('btn-delete-user').addEventListener('click', async () => {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return

    try {
        const res = await fetch(`${API_URL}/api/users/${currentEditUserId}`, {
            method: 'DELETE',
            credentials: 'include'
        })

        if (!res.ok) throw new Error()

        // Ferme le modal et recharge la liste
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide()
        printUsers()

    } catch {
        alert('Erreur lors de la suppression de l\'utilisateur')
    }
})

// Charge le nombre d'abonnés au chargement de la modal
document.getElementById('newsletterModal').addEventListener('show.bs.modal', async () => {
    try {
        const res = await fetch(`${API_URL}/api/newsletter/count`, {
            credentials: 'include'
        })
        const data = await res.json()
        document.getElementById('newsletter-count').textContent = `${data.count} destinataire${data.count > 1 ? 's' : ''}`
    } catch {
        document.getElementById('newsletter-count').textContent = '— destinataires'
    }
})

document.getElementById('btn-send-newsletter').addEventListener('click', async () => {
    const subject = document.getElementById('newsletter-subject').value.trim()
    const body = document.getElementById('newsletter-body').value.trim()
    const errorEl = document.getElementById('newsletter-error')
    const successEl = document.getElementById('newsletter-success')

    errorEl.classList.add('d-none')
    successEl.classList.add('d-none')

    if (!subject || !body) {
        errorEl.textContent = 'Veuillez remplir tous les champs.'
        errorEl.classList.remove('d-none')
        return
    }

    document.getElementById('btn-send-newsletter').disabled = true
    document.getElementById('btn-send-newsletter').textContent = 'Envoi en cours...'

    try {
        const res = await fetch(`${API_URL}/api/newsletter/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ subject, body })
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data.error)

        successEl.textContent = `✅ Newsletter envoyée à ${data.sent} abonné${data.sent > 1 ? 's' : ''} !`
        successEl.classList.remove('d-none')
        document.getElementById('newsletter-subject').value = ''
        document.getElementById('newsletter-body').value = ''

    } catch (err) {
        errorEl.textContent = err.message || 'Erreur lors de l\'envoi.'
        errorEl.classList.remove('d-none')
    } finally {
        document.getElementById('btn-send-newsletter').disabled = false
        document.getElementById('btn-send-newsletter').textContent = '📧 Envoyer'
    }
})


// Calcule un score de pertinence simple : priorité à "commence par", puis "contient"
function matchScore(text, query) {
    if (text.startsWith(query)) return 2
    if (text.includes(query)) return 1
    return 0
}

// Affiche les 5 utilisateurs les plus proches de la recherche, sous la barre
function showSearchResults(query) {
    const dropdown = document.getElementById('search-results')
    const q = query.trim().toLowerCase()

    if (!q) {
        dropdown.classList.add('d-none')
        dropdown.innerHTML = ''
        return
    }

    const results = allUsers
        .map(u => {
            const fullName = `${u.first_name} ${u.name}`.toLowerCase()
            const reversedName = `${u.name} ${u.first_name}`.toLowerCase()
            const score = Math.max(matchScore(fullName, q), matchScore(reversedName, q))
            return { user: u, score }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

    if (results.length === 0) {
        dropdown.innerHTML = `<div class="search-result-item" style="color:var(--texte-muted); cursor:default;">Aucun résultat</div>`
        dropdown.classList.remove('d-none')
        return
    }

    dropdown.innerHTML = results.map(r => `
        <div class="search-result-item" data-id="${r.user.id}">
            ${r.user.first_name} ${r.user.name}
            <span style="color:var(--texte-muted); font-size:.8rem;"> — ${r.user.email}</span>
        </div>
    `).join('')

    dropdown.classList.remove('d-none')

    // Au clic sur un résultat → ouvre la "fiche" (modal) de cette personne
    dropdown.querySelectorAll('.search-result-item[data-id]').forEach(item => {
        item.addEventListener('click', () => {
            const user = allUsers.find(u => String(u.id) === item.dataset.id)
            if (!user) return

            currentEditUserId = user.id
            document.getElementById('edit-user-first-name').value = user.first_name
            document.getElementById('edit-user-name').value = user.name
            document.getElementById('edit-user-email').value = user.email
            document.getElementById('edit-user-phone').value = user.telephone || ''
            document.getElementById('edit-user-address').value = user.address || ''
            document.getElementById('edit-user-isadmin').checked = user.isadmin
            document.getElementById('edit-user-isdelivery').checked = user.isdelivery

            dropdown.classList.add('d-none')
            document.getElementById('search-input').value = ''

            const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal'))
            modal.show()
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


printUsers()