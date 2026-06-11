// Page index.html
import { checkAuth } from './e-navbar.js'
import { addToCart, updateCartBadge, renderCart } from './e-cart.js'
//Emoji pour bandeau
function getEmojiForPizza(name) {
  const n = name.toLowerCase()

  if (n.includes('fromage')) return '🧀'
  if (n.includes('marg')) return '🍅'
  if (n.includes('piment')) return '🌶️'
  if (n.includes('champ')) return '🍄'
  if (n.includes('reine')) return '👑'
  if (n.includes('bbq')) return '🔥'
  if (n.includes('veggie')) return '🥦'
  if (n.includes('thon')) return '🐟'
  if (n.includes('calzone')) return '🥟'
  if (n.includes('bolognaise')) return '🍝'
  return '🍕' 
}

//Fonction pour afficher tous les produits link aux emojis
async function loadProducts() {
  try {
    const response = await fetch('/api/products')
    const products = await response.json()

    const track = document.getElementById('band-track')

    if (!products.length) {
      track.innerHTML = '<span class="band-item">Aucun produit trouvé</span>'
      return
    }

    //ForEach X2 pour un défilement continu
    products.forEach(p => {
      const span = document.createElement('span')
      span.classList.add('band-item')
      span.textContent = `${getEmojiForPizza(p.name)} ${p.name}`
      track.appendChild(span)
    })

    products.forEach(p => {
      const span = document.createElement('span')
      span.classList.add('band-item')
      span.textContent = `${getEmojiForPizza(p.name)} ${p.name}`
      track.appendChild(span)
    })

  } catch (err) {
    console.error(err)
  }
}
loadProducts()

//Afficher les cartes des mennus
async function loadMenu() {
  const grid = document.getElementById('menu-grid')
  const spinner = document.getElementById('menu-spinner')
  const error = document.getElementById('menu-error')

  try {
    const res = await fetch('/api/products')
    const products = await res.json()

    spinner.classList.add('d-none')

    if (!products.length) {
      grid.innerHTML = `<div class="col-12 text-center py-5" style="color:var(--texte-muted);">
        <p class="fs-4">😔 Aucune pizza disponible pour le moment.</p>
      </div>`
      return
    }

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
document.addEventListener('DOMContentLoaded', () => {
  checkAuth, 
  updateCartBadge(), 
  renderCart() })
