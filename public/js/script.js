// Page index.html

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
    const response = await fetch('http://localhost:3000/api/products')
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

//Fonction analyse pour navbar connecté ou non 
async function checkAuth() {
  try {
    //Check cookie connexion
    const res = await fetch('http://localhost:3000/api/me', {
      credentials: 'include'
    })

    if (!res.ok) {
      renderNavbarGuest()
      return null
    }

    const { user } = await res.json()

    renderNavbarUser(user)
    return user

  } catch {
    renderNavbarGuest()
    return null
  }
}

//Fonctions création NavBar
function renderNavbarGuest() {
  document.getElementById('nav-auth-zone').innerHTML = `
    <li class="nav-item">
      <a class="btn btn-rouge px-3 py-2 position-relative" href="#" id="cart-btn">
        🛒 Panier <span id="cart-badge" style="display:none;">0</span>
      </a>
    </li>
    <li class="nav-item">
      <a class="btn btn-brun px-4 py-2" href="connexion.html">Connexion</a>
    </li>
  `
}

function renderNavbarUser(user) {
  document.getElementById('nav-auth-zone').innerHTML = `
    <li class="nav-item">
      <a class="btn btn-rouge px-3 py-2 position-relative" href="#" id="cart-btn">
        🛒 Panier <span id="cart-badge" style="display:none;">0</span>
      </a>
    </li>
    <li class="nav-item">
      <a class="btn btn-rouge px-4 py-2" href="menu.html" id="btn-commander">
        🍕 Commander
      </a>
    </li>
    <li class="nav-item dropdown">
      <a class="btn btn-brun px-4 py-2 dropdown-toggle" href="#" data-bs-toggle="dropdown">
        👤 ${user.first_name}
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><a class="dropdown-item" href="profil.html">Mon profil</a></li>
        <li><a class="dropdown-item" href="commandes.html">Mes commandes</a></li>
        ${user.isadmin ? '<li><a class="dropdown-item text-danger" href="admin/index.html">Administration</a></li>' : ''}
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" id="btn-deconnexion">Déconnexion</a></li>
      </ul>
    </li>
  `
  //Bouton deconnexion
  document.getElementById('btn-deconnexion').addEventListener('click', async () => {
    await fetch('http://localhost:3000/api/deconnexion', {
      method: 'POST',
      credentials: 'include'
    })
    window.location.href = 'index.html'
  })
}

document.addEventListener('DOMContentLoaded', checkAuth)