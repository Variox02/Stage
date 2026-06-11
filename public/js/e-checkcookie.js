//Page de fonction servant à être appelé dans d'autres fichiers pour check si l'utilisateur à un cookie et si oui, est-ce qu'il est admin ou non
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

export async function isLogged() {
    const user = await getUser();
    return user !== null;
}

export async function isAdmin() {
    const user = await getUser();
    return user?.isadmin === true;
}

export async function isLivreur() {
    const user = await getUser();
    return user?.isdelivery === true;
}