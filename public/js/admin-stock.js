async function printProducts(){
    try {
        const response = await fetch('/api/products')
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des produits')
        }
        const products = await response.json()
        const div = document.getElementById('stock-tbody')



    }
    catch (error) {
        console.error(error)
    }
}