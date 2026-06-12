// Module de vérification d'authentification
// Vérifie si l'utilisateur est connecté, admin ou livreur via les cookies de session

// Récupère les informations de l'utilisateur actuellement connecté
// Retourne null si l'utilisateur n'est pas authentifié
export async function getUser() {
    try {
        const res = await fetch('/api/me', {
        credentials: 'include'
        });

        if (!res.ok) return null;

        const { user } = await res.json();
        return user;
    } catch {
        return null;
    }
}

// Vérifie si un utilisateur est connecté (a une session active)
// Retourne true/false
export async function isLogged() {
    const user = await getUser();
    return user !== null;
}

// Vérifie si l'utilisateur connecté est administrateur
// Retourne true uniquement si user.isadmin === true
export async function isAdmin() {
    const user = await getUser();
    return user?.isadmin === true;
}

// Vérifie si l'utilisateur connecté est livreur
// Retourne true uniquement si user.isdelivery === true
export async function isLivreur() {
    const user = await getUser();
    return user?.isdelivery === true;
}