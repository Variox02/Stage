// Page index.html

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

async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')
    const products = await response.json()

    const track = document.getElementById('band-track')

    if (!products.length) {
      track.innerHTML = '<span class="band-item">Aucun produit trouvé</span>'
      return
    }

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

