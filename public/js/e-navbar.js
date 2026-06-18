// Module de gestion de la barre de navigation
// Génère dynamiquement la navbar en fonction de l'authentification de l'utilisateur
import { getUser, isAdmin } from './e-checkcookie.js'

// Vérifie l'authentification et affiche la navbar appropriée
// Affiche soit la navbar "Invité", soit la navbar "Utilisateur connecté"
export async function checkAuth() {
    try {
        const user = await getUser()

        if (!user) {
        renderNavbarGuest()
        return null
        }

        renderNavbarUser(user)
        return user

    } catch {
        renderNavbarGuest()
        return null
    }
}

// Affiche la barre de navigation pour un utilisateur non authentifié
// Affiche les boutons "Panier" et "Connexion"
export function renderNavbarGuest() {
    document.getElementById('nav-auth-zone').innerHTML = `
        <li class="nav-item">
        <a class="btn btn-rouge px-3 py-2 position-relative" href="#" id="cart-btn" data-bs-toggle="modal" data-bs-target="#cartModal">
            🛒 Panier <span id="cart-badge" style="display:none;">0</span>
        </a>
        </li>
        <li class="nav-item">
        <a class="btn btn-brun px-4 py-2" href="connexion.html">Connexion</a>
        </li>
    `
}
export function renderNavbarUser(user) {
    document.getElementById('nav-auth-zone').innerHTML = `
        <a class="btn btn-rouge px-3 py-2 position-relative" href="#" id="cart-btn" data-bs-toggle="modal" data-bs-target="#cartModal">
            🛒 Panier <span id="cart-badge" style="display:none;">0</span>
        </a>
        <a class="btn btn-rouge px-4 py-2" href="menu.html" id="btn-commander">
        🍕 Commander
        </a>
        <div class="dropdown">
        <a class="btn btn-brun px-4 py-2 dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-display="static">
            👤 ${user.first_name}
        </a>
        <ul class="dropdown-menu dropdown-menu-end" data-bs-display="static">
            <li><a class="dropdown-item" href="profil.html">Mon profil</a></li>
            <li><a class="dropdown-item" href="profil.html">Mes commandes</a></li>
            ${user.isadmin ? '<li><a class="dropdown-item text-danger" href="admin/admin.html">Administration</a></li>' : ''}
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="btn-deconnexion">Déconnexion</a></li>
        </ul>
        </div>
    `
    document.getElementById('btn-deconnexion').addEventListener('click', async () => {
        await fetch('https://stage-ydwe.onrender.com/api/deconnexion', { 
        method: 'POST', 
        credentials: 'include' 
        })
        window.location.href = 'index.html'
    })
}