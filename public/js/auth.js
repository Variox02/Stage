// Page inscription.html et connexion.html
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

function getStrength(value){
    let score = 0
    if (value.length >=8) score++
    if (value.length >=12) score++
    if (/[0-9]/.test(value)) score++
    if (/[^A-Za-z0-9]/.test(value)) score++
    return score
}

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
document.getElementById('password').addEventListener('input', (e) => {
    const value = e.target.value
    const score = getStrength(value)
    const segs = [1, 2, 3, 4].map(n => document.getElementById(`seg-${n}`))

    segs.forEach((seg, i) => {
        seg.className = 'strength-seg'
        if (i < score) seg.classList.add(strengthClasses[score])
    })

    document.getElementById('strength-hint').textContent = value.length
        ? strengthLabels[score]
        : ''    
})


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

function validate(first_name, name, email, password, confirm, cgu) {
    let valid = true
    ;['prenom', 'nom', 'email', 'password', 'confirm', 'cgu'].forEach(clearError)

    if (!first_name) { showError('prenom', 'Champ requis.'); valid = false }
    if (!name)       { showError('nom',    'Champ requis.'); valid = false }

    if (!email) {
        showError('email', 'Veuillez saisir votre adresse e-mail.'); valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('email', 'Adresse e-mail invalide.'); valid = false
    }
    if (!password) {
        showError('password', 'Veuillez choisir un mot de passe.'); valid = false
    } else if (password.length < 8) {
        showError('password', 'Le mot de passe doit contenir au moins 8 caractères.'); valid = false
    }

    if (password && confirm !== password) {
        showError('confirm', 'Les mots de passe ne correspondent pas.'); valid = false
    }

    if (!cgu) {
        showError('cgu', 'Vous devez accepter les CGU pour continuer.'); valid = false
    }

    return valid
}

document.getElementById('form-inscription').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const first_name = document.getElementById('prenom').value.trim()
    const name = document.getElementById('nom').value.trim()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const confirm = document.getElementById('password-confirm').value
    const cgu = document.getElementById('cgu').checked
    const newsletter = document.getElementById('newsletter').checked

    if (!validate(first_name, name, email, password, confirm, cgu)) return

    setLoading(true)

    try {
    const response = await fetch('http://localhost:3000/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, name, email, password, newsletter })
    })

    const data = await response.json()

    if (!response.ok) {
        showAlert(data.error || 'Une erreur est survenue.')
        return
    }

    showAlert('Compte créé avec succès ! Redirection…', 'success')
    setTimeout(() => { window.location.href = 'stage/public/connexion.html' }, 2000)

    } catch (err) {
        console.error(err)
        showAlert('Erreur avec le serveur')
    } finally {
        setLoading(false)
    }
})