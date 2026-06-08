Mission 2 — Développement de l'application web JavaScript
Vous développerez une application web complète en JavaScript en respectant l'ensemble des 
contraintes techniques listées ci-dessous.


Base de données

• Utiliser une base de données PostgreSQL hébergée sur Supabase
• Concevoir et implémenter au minimum 5 tables relationnelles
• Documenter le schéma de base de données (MCD ou diagramme entité-relation)

Stockage côté client

• Utiliser des cookies httpOnly pour toutes les données sensibles (ex : tokens 
d'authentification)
• Utiliser le localStorage pour les données métiers non sensibles (ex : préférences utilisateur, 
cache local)

Architecture REST

• Respecter les conventions REST : utilisation correcte des verbes HTTP (GET, POST, PUT, 
DELETE, PATCH)
• Concevoir des URIs claires, cohérentes et hiérarchiques
• Retourner les codes de statut HTTP appropriés (200, 201, 400, 401, 404, 500, etc.)

Concurrence dynamique (temps réel)

• Mettre en œuvre les WebSockets (ou l'API Realtime de Supabase) pour synchroniser les 
actions entre plusieurs clients connectés simultanément
• La page doit se mettre à jour automatiquement sans rechargement lorsqu'un autre 
utilisateur effectue une action

Sécurité (OWASP TOP 10)

• Protéger l'application contre les injections SQL (utiliser des requêtes paramétrées)
• Mettre en place une protection contre les attaques XSS (échappement des sorties)
• Implémenter une protection CSRF
• Gérer correctement l'authentification et les sessions
• Ne jamais exposer d'informations sensibles dans les logs ou les messages d'erreur

CRUD complet

• Implémenter les quatre opérations de base sur au moins une ressource : Create, Read, 
Update, Delete
• L'interface utilisateur doit permettre d'effectuer toutes ces opérations de manière intuitive

Gestion des accès et rôles

• Mettre en place un système d'authentification (inscription / connexion / déconnexion)
• Restreindre l'accès à une section d'administration aux seuls utilisateurs autorisés
• Toute tentative d'accès non autorisé doit être redirigée ou bloquée


Mission 3 — Déploiement
Le projet devra être déployé et accessible en ligne à la fin de la période de stage :
• Déployer le frontend (interface utilisateur) sur GitHub Pages
• Configurer la base de données PostgreSQL sur Supabase (plan gratuit)
• Vérifier que l'application fonctionne correctement en production (tests de bout en bout)
• Fournir l'URL de l'application déployée à votre tutrice




Description du projet : 

Créer un site web dynamique en JS pour une pizzaria 
Description de l'entreprise : les cuisiners font des pizzas, l'enregistre dans les stocks, les clients peuvent commander les pizzas dispo en stock, possiblités après de venir les chercher/livraison
Objectif : mettre en relation les cuisines, clients, commandes, et livreurs afin de faciliter la gestion/communication

- Création de comptes (user, admin, livreur)

Côté user : 
    - Info personnelles requises
    - Validation/vérif par mail
    - Mdp --> 8 - 16 char + 1 chiffres mini
    - Connexion/déconnexion
    - Changements d'infos (persos et mdp)
    - Commander --> 
        - Choisir ses produits
        - Système de payement (utiliser Stripe)
        - facturation, gén de pdf --> Voir + télécharger pdf
        - Si possible --> Service de communication avec Admins
    - 

Côté Admin : 
    - Gestion des users
    - Gestion des stocks
    - Vu sur les commandes et factures
    - Vu et Gestion sur les livreurs
    - 

Côté livreur : 
    - Same as User
    - Vu et choix sur les commandes
    - Voir adresse de livraison + nom clients
    - 