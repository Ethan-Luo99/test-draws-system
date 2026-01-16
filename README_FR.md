# Système de Tirage au Sort de Test (Test Draws System)

Ceci est un projet de test full-stack conçu pour démontrer le flux principal d'un système de tirage au sort pour restaurant.

## Structure du Projet (Project Structure)

- `backend/`: Node.js Express API + PostgreSQL
- `mobile-app/`: React Native (Expo) Application Utilisateur
- `restaurant-dashboard/`: React Native (Expo) Application de Gestion Restaurant

## Flux Principal (Core Workflow)

1.  **Tableau de Bord Restaurant** → Crée un événement de tirage (supporte le tirage à heure fixe ou par nombre de participants).
2.  **App Utilisateur** → Voit l'événement de tirage sur la page du restaurant après connexion.
3.  **App Utilisateur** → Clique sur "Participer", le système enregistre la participation.
    *   *Note : Un utilisateur ne peut participer qu'une seule fois au même événement.*
    *   *Note : Si les conditions de tirage sont remplies (ex: N-ième participant), le système déclenche automatiquement le tirage.*
4.  **Tableau de Bord Restaurant** → Consulte la liste des participants et le nombre total.
5.  **Tableau de Bord Restaurant** → Peut modifier ou annuler les événements non commencés (sans participants).

## Architecture Technique (Architecture)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: PostgreSQL
- **Auth**: Supabase (Auth Client) + Custom JWT (Session Serveur)

### Base de Données (Database)
Voir [INTEGRATION_FR.md](./INTEGRATION_FR.md) pour une description détaillée.

### Processus d'Authentification (Authentication)

1.  **Connexion Utilisateur (Mobile App)**
    *   L'App utilise le SDK Supabase pour se connecter.
    *   Appelle `POST /api/v1/auth/exchange` pour échanger contre un JWT backend.
    *   L'interface renvoie également `default_business` (infos du commerce par défaut) pour l'affichage dans l'App.

2.  **Restaurant Sans Connexion (Dashboard)**
    *   **Mode Test**: Le côté restaurant ne nécessite pas de connexion.
    *   Identification via le Header `X-Business-ID: <DEMO_BUSINESS_ID>`.
    *   Le backend autorise automatiquement les requêtes avec le bon Header.

## Démarrage Rapide (Quick Start)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start --offline
```

### Restaurant Dashboard
```bash
cd restaurant-dashboard
npm install
npx expo start --offline
```
