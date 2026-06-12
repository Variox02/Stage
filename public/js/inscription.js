// Script de la page d'inscription
import { addToCart, updateCartBadge, renderCart } from './e-cart.js'

// Affiche un message d'erreur sous un champ de formulaire
function showError(fieldId, message) {
    const field = document.getElementById(fieldId)
    const error = document.getElementById(`${fieldId}-error`)
    if (field)  field.classList.add('is-invalid')
    if (error)  error.textContent = message
}

// Efface le message d'erreur d'un champ
function clearError(fieldId) {
    const field = document.getElementById(fieldId)
    const error = document.getElementById(`${fieldId}-error`)
    if (field)  field.classList.remove('is-invalid')
    if (error)  error.textContent = ''
}

// Bascule l'tat de chargement du bouton d'envoi
function setLoading(state) {
    const btn     = document.getElementById('btn-submit')
    const btnText = document.getElementById('btn-text')
    const spinner = document.getElementById('btn-spinner')
    if (!btn) return
    btn.disabled = state
    btnText.textContent = state ? 'Chargement...' : 'Créer mon compte'
    spinner.classList.toggle('d-none', !state)
}

// Affiche une alerte générale (erreur ou succès)
function showAlert(message, type = 'error') {
    const alert = document.getElementById('auth-alert')
    if (!alert) return
    alert.textContent = message
    alert.className = `auth-alert ${type === 'success' ? 'auth-alert-success' : 'auth-alert-error'}`
    alert.classList.remove('d-none')
}

// Calcule et retourne la force du mot de passe (0-4)
function getStrength(value){
    let score = 0
    if (value.length >=8) score++
    if (value.length >=12) score++
    if (/[0-9]/.test(value)) score++
    if (/[^A-Za-z0-9]/.test(value)) score++
    return score
}

// Labels et classes CSS pour l'indicateur de force de mot de passe
const strengthLabels = [
    '',
    'Faible - Ajoutez des chiffres ou symboles',
    'Moyen - Ajoutez un symbole ou allongez',
    'Bon',
    'Excellent'
]
const strengthClasses = [
    '',
    'weak',
    'medium',
    'strong',
    'strong',
]

// Met à jour l'indicateur visuel de force du mot de passe lors de la saisie
document.getElementById('password').addEventListener('input', (e) => {
    const value = e.target.value
    const score = getStrength(value)
    const segs = [1, 2, 3, 4].map(n => document.getElementById(`seg-${n}`))

    segs.forEach((seg, i) => {
        if (!seg) return
        seg.className = 'strength-seg'
        if (i < score) {
            seg.classList.add(strengthClasses[score])
        }
    })

    document.getElementById('strength-hint').textContent = value.length
        ? strengthLabels[score]
        : ''    
})

// Initialise la bascule afficher/masquer pour un champ de mot de passe
function initPasswordToggle(inputId, btnId) {
    const input = document.getElementById(inputId)
    const btn   = document.getElementById(btnId)
    if (!input || !btn) return

    btn.addEventListener('click', () => {
        const isHidden = input.type === 'password'
        input.type = isHidden ? 'text' : 'password'
        btn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe')
    })
}

initPasswordToggle('password', 'toggle-password')
initPasswordToggle('password-confirm', 'toggle-password-confirm')

// Valide tous les champs du formulaire d'inscription
// Vérifie que les champs requis sont remplis, que l'email est valide, etc.
function validate(first_name, name, email, password, confirm, cgu, country, birth_date, address) {
    let valid = true;['prenom', 'nom', 'email', 'password', 'confirm', 'cgu', 'country', 'birth_date', 'address'].forEach(clearError)

    if (!first_name) { showError('prenom', 'Champ requis.'); valid = false }
    if (!name)       { showError('nom',    'Champ requis.'); valid = false }

    // Vérifie que l'email est valide
    if (!email) {
        showError('email', 'Veuillez saisir votre adresse e-mail.'); valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Adresse e-mail invalide.'); valid = false
    }

    // Vérifie le mot de passe
    if (!password) {
        showError('password', 'Veuillez choisir un mot de passe.'); valid = false
    } else if (password.length < 8) {
        showError('password', 'Le mot de passe doit contenir au moins 8 caractères.'); valid = false
    }

    // Vérifie que les mots de passe correspondent
    if (password && confirm !== password) {
        showError('confirm', 'Les mots de passe ne correspondent pas.'); valid = false
    }

    // Vérifie l'acceptation des CGU
    if (!cgu) {
        showError('cgu', 'Vous devez accepter les CGU pour continuer.'); valid = false
    }

    // Vérifie le pays
    if(!country) { showError('country',' Champ requis.'); valid = false}

    // Vérifie la date de naissance et que l'utilisateur a 16 ans minimum
    if(!birth_date) { 
        showError('birth_date',' Veuillez mettre votre âge.'); valid = false
    } else {
        const today = new Date()
        const birth = new Date(birth_date)

        const age = today.getFullYear() - birth.getFullYear()
        if (age < 16) {
            showError('birth_date', 'Vous devez avoir au moins 16 ans.'); valid = false
        }
    }
    if(!address) { showError ('address', 'Champ requis.'); valid = false }
    return valid
}

// Gère la soumission du formulaire d'inscription
// Vérifie les données, vérifie la disponibilité de l'email et cre le compte
document.getElementById('form-inscription').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const first_name = document.getElementById('prenom').value.trim()
    const name = document.getElementById('nom').value.trim()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const confirm = document.getElementById('password-confirm').value
    const cgu = document.getElementById('cgu').checked
    const newsletter = document.getElementById('newsletter').checked
    const country = document.getElementById('country').value
    const birth_date = document.getElementById('birth_date').value
    const address = document.getElementById('address').value

    if (!validate(first_name, name, email, password, confirm, cgu, country, birth_date, address)) return

    setLoading(true)

    // Vérifie que l'email n'est pas déjà utilisé
    let emailDisponible
    try {
        const checkRes = await fetch('/api/verifMail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        const checkData = await checkRes.json()
        emailDisponible = checkData.exists === false
    } catch (err) {
        console.error(err)
        showAlert('Erreur avec le serveur')
        setLoading(false)
        return
    }

    if (!emailDisponible) {
        showError('email', 'Cette adresse e-mail est déjà utilisée.')
        setLoading(false)
        return
    }

    // Envoie la demande d'inscription au serveur
    try {
    const response = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, name, email, password, newsletter, country, birth_date, address })
    })

    const data = await response.json()

    if (!response.ok) {
        showAlert(data.error || 'Une erreur est survenue.')
        return
    }

    showAlert('Compte créé avec succès ! Redirection…', 'success')
    setTimeout(() => { window.location.href = '/connexion.html' }, 2000)

    } catch (err) {
        console.error(err)
        showAlert('Erreur avec le serveur')
    } finally {
        setLoading(false)
    }
})

// Initialise le panier au chargement de la page
document.addEventListener('DOMContentLoaded', () => { 
    updateCartBadge(), 
    renderCart() 
})