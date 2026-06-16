//Fonction qui associe un emoji à une pizza en fonction de son nom et le renvoie. Si aucun emoji spécifique n'est trouvé, renvoie l'emoji par défaut 🍕
export function getEmojiForPizza(name) {
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