import { checkAuth } from './e-navbar.js'
import { API_URL } from './e-config.js'

// Nettoyage du panier après la commande réussie
localStorage.removeItem('cart')

async function loadLastCommande() {
    try {
        const res = await fetch('${API_URL}/api/lastCommande', {
            credentials: 'include'
        })
        if (!res.ok) return

        const { id } = await res.json()

        const btn = document.getElementById('btn-download-facture')
        if (btn) {
            btn.href = `${API_URL}/api/facture/${id}`
            btn.classList.remove('d-none')
        }

    } catch (err) {
        console.error(err)
    }
}

loadLastCommande()
document.addEventListener('DOMContentLoaded', checkAuth)

document.addEventListener('DOMContentLoaded', checkAuth)