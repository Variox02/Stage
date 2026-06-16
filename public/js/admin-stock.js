import { getEmojiForPizza } from './e-utils.js'

async function printProducts(){
    try {
        const response = await fetch('https://stage-ydwe.onrender.com/api/products')
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits')
        }
        const products = await response.json()
        const div = document.getElementById('stock-tbody')

        products.forEach(p => {
            const stock = parseInt(p.stock)
            let badgeClass = 'admin-stock-ok'
            if (stock === 0) {
                badgeClass = 'admin-stock-rupture'
            }else {
                if (stock <= 3) badgeClass = 'admin-stock-low'
            }

            const tr = document.createElement('tr')
            tr.innerHTML = `
                <td class="text-center fs-4">${getEmojiForPizza(p.name)}</td>
                <td><span class="admin-product-name">${p.name}</span></td>
                <td><span class="admin-product-desc">${p.description || '—'}</span></td>
                <td class="text-center"><span class="admin-price">${parseFloat(p.price).toFixed(2)} €</span></td>
                <td class="text-center"><span class="admin-stock-badge ${badgeClass}" id="badge-${p.id}">${stock}</span></td>
                <td class="text-center">
                    <div class="admin-qty-wrap">
                        <button class="admin-qty-btn" data-id="${p.id}" data-delta="-1">−</button>
                        <input class="admin-qty-input" type="number" value="${stock}" min="0" id="input-${p.id}" />
                        <button class="admin-qty-btn" data-id="${p.id}" data-delta="1">+</button>
                    </div>
                </td>
            `
            tbody.appendChild(tr)
        })
        document.querySelectorAll('.admin-qty-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id
                const display = document.getElementById(`input-${id}`)
                const newVal = Math.max(0, parseInt(display.textContent) + parseInt(btn.dataset.delta))

                try {
                    const res = await fetch(`https://stage-ydwe.onrender.com/api/products/${id}/stock`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ stock: newVal })
                    })

                    if (!res.ok) {
                        throw new Error()
                    }

                    // Mettre à jour l'affichage et le badge
                    display.textContent = newVal
                    const badge = document.getElementById(`badge-${id}`)
                    badge.textContent = newVal
                    badge.className = 'admin-stock-badge'
                    if (newVal === 0) badge.classList.add('admin-stock-rupture')
                    else if (newVal <= 3) badge.classList.add('admin-stock-low')
                    else badge.classList.add('admin-stock-ok')

                } catch {
                    alert('Erreur lors de la mise à jour du stock')
                }
        })
    })

    }
    catch (error) {
        console.error(error)
    }
}
printProducts()