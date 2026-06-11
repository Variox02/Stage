// Page connexion.html
import { addToCart, updateCartBadge, renderCart } from './e-cart.js'
function showError(fieldId, message) {
    const field = document.getElementById(fieldId)
    const error = document.getElementById(`${fieldId}-error`)
    if (field)  field.classList.add('is-invalid')
    if (error)  error.textContent = message
}
function clearError(fieldId) {
    const field = document.getElementById(fieldId)
    const error = document.getElementById(`${fieldId}-error`)
    if (field)  field.classList.remove('is-invalid')
    if (error)  error.textContent = ''
}
function setLoading(state) {
    const btn     = document.getElementById('btn-submit')
    const btnText = document.getElementById('btn-text')
    const spinner = document.getElementById('btn-spinner')
    if (!btn) return
    btn.disabled = state
    btnText.textContent = state ? 'Chargement...' : 'Créer mon compte'
    spinner.classList.toggle('d-none', !state)
}
function showAlert(message, type = 'error') {
    const alert = document.getElementById('auth-alert')
    if (!alert) return
    alert.textContent = message
    alert.className = `auth-alert ${type === 'success' ? 'auth-alert-success' : 'auth-alert-error'}`
    alert.classList.remove('d-none')
}

//Fonction Password visible ou non
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

//Analyse du form connexion
document.getElementById('form-connexion').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    try {
        const response = await fetch('/api/connexion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        })

        const data = await response.json()

        if (!response.ok) {
            showAlert(data.error || 'Une erreur est survenue.')
            return
        }

        window.location.href = 'index.html'

    } catch (err) {
        console.error(err)
        showAlert('Impossible de joindre le serveur.')
    }
})

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge()
    renderCart()  
})