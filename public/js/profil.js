//Js de la page profil.html
import { checkAuth } from './navbar.js'

//Affichage des données utilisateurs, fetch dans editprofil.js
async function loadUser() {
    try {
        const res = await fetch('http://localhost:3000/api/getUser', {
            credentials: 'include'
        })

        if (!res.ok) return

        const { user } = await res.json()

        document.getElementById('profil-prenom').textContent = user.first_name
        document.getElementById('profil-nom').textContent = user.name
        document.getElementById('profil-email-display').textContent = user.email
        document.getElementById('profil-country').textContent = user.country
        document.getElementById('profil-address').textContent = user.address 


        document.getElementById('profil-name').textContent = user.first_name + ' ' + user.name

        document.getElementById('profil-email').textContent = user.email

        document.getElementById('profil-avatar').textContent = user.first_name[0].toUpperCase() + user.name[0].toUpperCase()

        if (user.create_date) {
            const date = new Date(user.create_date)
            const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            document.querySelector('.profil-badge').textContent = `Membre depuis ${mois}`
        }

        document.getElementById('pref-newsletter').checked = user.newsletter === true

        if (user.birth_date) {
            const naissance = new Date(user.birth_date).toLocaleDateString('fr-FR')
            document.getElementById('profil-birthdate').textContent = naissance
        }

    } catch (err) {
        console.error(err)
    }
}

loadUser()
document.addEventListener('DOMContentLoaded', checkAuth)