import { checkAuth } from './e-navbar.js'

// Nettoyage du panier après la commande réussie
localStorage.removeItem('cart')

document.addEventListener('DOMContentLoaded', checkAuth)