// Script de la page profil.html
import { checkAuth } from './e-navbar.js'
import { addToCart, updateCartBadge, renderCart } from './e-cart.js'

let currentUser = null

// Charge et affiche les données de l'utilisateur connecté
async function loadUser() {
    try {
        const res = await fetch('https://stage-ydwe.onrender.com/api/getUser', {
            credentials: 'include'
        })

        if (!res.ok) return

        const { user } = await res.json()
        currentUser = user
        
        // Remplit les champs de formulaire avec les données actuelles
        document.getElementById('profil-prenom').value = user.first_name
        document.getElementById('profil-nom').value = user.name
        document.getElementById('profil-email-display').value = user.email
        document.getElementById('profil-country').value = user.country
        document.getElementById('profil-address').value = user.address 

        // Affiche le nom et l'email en en-tête
        document.getElementById('profil-name').textContent = user.first_name + ' ' + user.name
        document.getElementById('profil-email').textContent = user.email

        // Affiche les initiales comme avatar
        document.getElementById('profil-avatar').textContent = user.first_name[0].toUpperCase() + user.name[0].toUpperCase()

        // Affiche la date d'adhésion
        if (user.create_date) {
            const date = new Date(user.create_date)
            const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            document.querySelector('.profil-badge').textContent = `Membre depuis ${mois}`
        }

        // Coche la newsletter si l'utilisateur est abonné
        document.getElementById('pref-newsletter').checked = user.newsletter === true

    } catch (err) {
        console.error(err)
    }
}

loadUser()

// Changement de mot de passe
document.getElementById('form-securite').addEventListener('submit', async (e) => {
    e.preventDefault()

    //Récupère l'ancien mot de passe comme vérification et les nouveaux
    const oldPassword = document.getElementById('old-password').value
    const newPassword = document.getElementById('new-password').value
    const confirmPassword = document.getElementById('confirm-new-password').value

    //Vérification de la conformité du nouveau mot de passe
    if(newPassword.length <8){
        alert('Le nouveau mot de passe doit faire mininmum 8 caractères')
        return
    }

    //Vérification de confirmation
    if(newPassword !== confirmPassword){
        alert('Les mots de passe ne correspondent pas')
        return
    }

    try{
        const res = await fetch('https://stage-ydwe.onrender.com/api/updatePassword', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                old_password: oldPassword,
                new_password: newPassword
            })
        })
        const data = await res.json()
        if(!res.ok){
            alert(data.error)
            return
        }

        alert("Mot de passe modifié avec succès !")
        document.getElementById('form-securite').reset()

    } catch(err){
        console.error(err)
        alert('Erreur serveur')
    }

})




// Traite la soumission du formulaire de modification des informations utilisateur
document.getElementById('form-infos').addEventListener('submit', async (e) => {
    e.preventDefault()

    const updateFields = {
        name: document.getElementById('profil-nom').value,
        first_name: document.getElementById('profil-prenom').value,
        email: document.getElementById('profil-email-display').value,
        country: document.getElementById('profil-country').value,
        address: document.getElementById('profil-address').value,
        newsletter: document.getElementById('pref-newsletter').checked
    }

    // Détecte uniquement les champs modifiés
    const changes = {}

    Object.keys(updateFields).forEach(key => {
        if (updateFields[key] !== currentUser[key]){
            changes[key] = updateFields[key]
        }
    })

    // Vérifie qu'il y a au moins une modification
    if(Object.keys(changes).length === 0){
        alert('Aucune modification détectée')
        return
    }

    try {
        const res = await fetch('https://stage-ydwe.onrender.com/api/updateUser', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(changes)
        })
        const data = await res.json()

        if(!res.ok){
            alert(data.error)
            return
        }
        alert('Profil mis à jour')
    } catch (err){
        console.error(err)
        alert('Erreur serveur')
    }
    loadUser() // Recharge les données utilisateur
})

// Charge l'historique des commandes de l'utilisateur
async function loadCommandes() {
    try {
        const res = await fetch('https://stage-ydwe.onrender.com/api/getCommandes', {
            credentials: 'include'
        })

        if (!res.ok) return

        const { commandes } = await res.json()

        const container = document.getElementById('commandes-list')
        const emptyState = document.querySelector('.profil-empty')

        // Affiche le message "Aucune commande" si la liste est vide
        if (!commandes.length) {
            emptyState.style.display = 'block'
            return
        }

        emptyState.style.display = 'none'

        // Crée une carte pour chaque commande
        commandes.forEach(cmd => {
            const div = document.createElement('div')
            div.className = 'commande-item mb-3 p-3 border rounded'

            const date = new Date(cmd.create_date).toLocaleDateString('fr-FR')
            const lignesHtml = cmd.lignes.map(l => 
                `<li>${l.quantity} × ${l.product_name} (${l.price_unit} €)</li>`
            ).join('')

            div.innerHTML = `
                <div class="d-flex justify-content-between mb-2">
                    <strong>Commande #${cmd.commande_id}</strong>
                    <span>${date}</span>
                </div>
                <ul class="mb-2">${lignesHtml}</ul>
                <div class="text-end fw-bold">Total : ${cmd.price} €</div>
            `

            container.appendChild(div)
        })

    } catch (err) {
        console.error(err)
    }
}

loadCommandes()

// Initialise le panier au chargement de la page
document.addEventListener('DOMContentLoaded', () => { 
    updateCartBadge(), 
    renderCart() 
})
