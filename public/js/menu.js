// Script de la page menu.html
import { checkAuth } from './e-navbar.js'
import { addToCart, updateCartBadge, renderCart, CheckoutBtn } from './e-cart.js'
import { getEmojiForPizza } from './e-utils.js'


// Charge et affiche toutes les pizzas disponibles
// Chaque carte contient un bouton "Ajouter au panier"
async function loadMenu() {
    const grid = document.getElementById('menu-grid')
    const spinner = document.getElementById('menu-spinner')
    const error = document.getElementById('menu-error')

    try {
        const res = await fetch('https://stage-ydwe.onrender.com/api/products')
        const products = await res.json()

        spinner.classList.add('d-none')

        if (!products.length) {
            grid.innerHTML = `<div class="col-12 text-center py-5"><p class="fs-4">😔 Aucune pizza disponible.</p></div>`
            return
        }

        // Crée une carte pour chaque produit avec le bouton "Ajouter"
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
                            <button class="btn btn-rouge btn-sm add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
                                🛒 Ajouter
                            </button>
                        </div>
                    </div>
                </div>
            `
            grid.appendChild(col)
        })

        // Attache les événements click aux boutons "Ajouter au panier"
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', () => addToCart({
                id:    btn.dataset.id,
                name:  btn.dataset.name,
                price: parseFloat(btn.dataset.price)  // Convertit string en number
            }))
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
    checkAuth()
    updateCartBadge()
    renderCart()  
    CheckoutBtn()
})
