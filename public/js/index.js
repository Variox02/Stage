// Script de la page d'accueil (index.html)
import { checkAuth } from './e-navbar.js'
import { addToCart, updateCartBadge, renderCart, CheckoutBtn } from './e-cart.js'
import { getEmojiForPizza } from './e-utils.js'
import { API_URL } from './e-config.js'

// Charge les produits et remplit le bandeau défilant avec les noms de pizzas
// Affiche chaque pizza deux fois pour un effet de défilement continu
async function loadProducts() {
  try {
    const response = await fetch(`${API_URL}/api/products`)
    const products = await response.json()

    const track = document.getElementById('band-track')
    track.innerHTML = ''
    track.classList.remove('band-ready')

    if (!products.length) {
      track.innerHTML = '<span class="band-item">Aucun produit trouvé</span>'
      return
    }

    // Calcule combien de répétitions sont nécessaires pour dépasser largement l'écran
    // (sécurité : on vise au moins 3x la largeur visible, plafonné pour ne pas exploser le DOM)
    const screenWidth = window.innerWidth
    const estimatedItemWidth = 150 // largeur moyenne approximative d'un item en px
    const itemsNeededForScreen = Math.ceil(screenWidth / estimatedItemWidth)
    const repeatsForScreen = Math.ceil(itemsNeededForScreen / products.length) + 1
    const safeRepeats = Math.min(Math.max(repeatsForScreen, 2), 8) // entre 2 et 8 répétitions max

    function appendOneSet() {
      products.forEach(p => {
        const span = document.createElement('span')
        span.classList.add('band-item')
        span.textContent = `${getEmojiForPizza(p.name)} ${p.name}`
        track.appendChild(span)
      })
    }

    // Premier set, pour mesurer sa largeur réelle (gap inclus avec le set suivant)
    appendOneSet()
    const gapValue = parseFloat(getComputedStyle(track).gap) || 0
    const singleSetWidth = track.scrollWidth + gapValue

    // Ajoute les sets supplémentaires nécessaires pour couvrir large l'écran
    for (let i = 1; i < safeRepeats; i++) {
      appendOneSet()
    }

    const speed = 30 // px par seconde
    const duration = singleSetWidth / speed

    track.style.setProperty('--scroll-distance', `-${singleSetWidth}px`)
    track.style.setProperty('--scroll-duration', `${duration}s`)
    track.classList.add('band-ready')

  } catch (err) {
    console.error(err)
  }
}
loadProducts()

// Charge et affiche les cartes des pizzas disponibles dans la section menu
// Masque le spinner et gère les erreurs
async function loadMenu() {
  const grid = document.getElementById('menu-grid')
  const spinner = document.getElementById('menu-spinner')
  const error = document.getElementById('menu-error')

  try {
    const res = await fetch(`${API_URL}/api/products`)
    const products = await res.json()

    spinner.classList.add('d-none')

    if (!products.length) {
      grid.innerHTML = `<div class="col-12 text-center py-5" style="color:var(--texte-muted);">
        <p class="fs-4">😔 Aucune pizza disponible pour le moment.</p>
      </div>`
      return
    }

    // Crée une carte pour chaque produit
    products.forEach(p => {
      const emoji = getEmojiForPizza(p.name)
      const price = parseFloat(p.price).toFixed(2)

      const col = document.createElement('div')
      col.className = 'col-md-6 col-lg-4'
      col.innerHTML = `
        <div class="card h-100 pizza-card border-0 shadow-sm">
          <div class="pizza-card-img bg-warning bg-opacity-10">${emoji}</div>
          <div class="card-body px-4 pb-4 d-flex flex-column">
            <h5 class="pizza-name mb-1">${p.name}</h5>
            <p class="pizza-ingr mb-3 flex-grow-1">${p.description || 'Pas de description disponible.'}</p>
            <div class="d-flex align-items-center justify-content-between">
              <span class="pizza-price">${price} € <small class="fw-normal text-muted">/ 30cm</small></span>
            </div>
          </div>
        </div>
      `
      grid.appendChild(col)
    })

  } catch (err) {
    console.error(err)
    spinner.classList.add('d-none')
    error.textContent = 'Impossible de charger le menu.'
    error.classList.remove('d-none')
  }
}

loadMenu()
// Initialise la navbar et le panier au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  checkAuth(), 
  updateCartBadge(), 
  renderCart(),
  CheckoutBtn()
})
