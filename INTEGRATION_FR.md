# Guide d'Intégration (Integration Guide)

## 1. Schéma de Base de Données (Database Schema)

Le système comprend actuellement deux tables principales, conçues pour être simples et répondre aux besoins commerciaux de base.

### Table `draws` (Tirages au sort)
| Nom du champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Clé primaire |
| `business_id` | UUID | ID du commerce (Fixé à `DEMO_BUSINESS_ID` pour les tests) |
| `title` | VARCHAR | Titre de l'événement |
| `description` | TEXT | Description de l'événement |
| `type` | VARCHAR | Type : `fixed_date` (Date fixe) ou `condition` (Déclenchement par condition) |
| `trigger_value` | INTEGER | Seuil de déclenchement (Valide uniquement pour le type `condition`, ex: 10 participants) |
| `draw_date` | TIMESTAMP | Heure du tirage (Valide uniquement pour le type `fixed_date`) |
| `status` | VARCHAR | Statut : `draft` (brouillon), `active` (actif), `closed` (fermé), `completed` (terminé) |
| `winner_user_id` | UUID | ID de l'utilisateur gagnant (Rempli après le tirage) |
| `is_active` | BOOLEAN | Marqueur de suppression logique (Soft delete) |

### Table `draw_participants` (Enregistrements de participation)
| Nom du champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Clé primaire |
| `draw_id` | UUID | Événement de tirage associé |
| `user_id` | UUID | Utilisateur associé (Supabase User ID) |
| `participated_at` | TIMESTAMP | Heure de participation |
| `is_winner` | BOOLEAN | Est gagnant |

---

## 2. Aperçu de l'API (API Overview)

### A. Authentification et Autorisation (Auth)
*   **Échange de Token**: `POST /api/v1/auth/exchange`
    *   **Entrée**: `{ supabase_token: "..." }`
    *   **Sortie**: `{ custom_token: "...", user: {...}, default_business: {...} }`
    *   **Logique**: Valide le Token Supabase, émet un JWT personnalisé pour le backend, et renvoie les infos utilisateur et les infos du commerce par défaut.

### B. Tableau de Bord Restaurant (Restaurant Dashboard)
*Méthode d'Auth : Header `X-Business-ID: <DEMO_BUSINESS_ID>`*

1.  **Obtenir les infos du commerce**: `GET /api/v1/restaurant/me`
    *   Renvoie les informations de test codées en dur (Nom, Logo, etc.).
2.  **Créer un tirage**: `POST /api/v1/draws`
    *   Supporte les types `fixed_date` (avec `draw_date`) et `condition` (avec `trigger_value`).
3.  **Obtenir la liste des tirages**: `GET /api/v1/draws`
    *   Renvoie tous les événements pour ce commerce, y compris le nombre actuel de participants (`participant_count`).
4.  **Modifier un tirage**: `PUT /api/v1/draws/:id`
    *   **Restriction**: Autorisé uniquement s'il n'y a aucun participant.
5.  **Annuler un tirage**: `POST /api/v1/draws/:id/cancel`
    *   **Logique**: Annulation douce (définit le statut sur `closed`), conserve l'enregistrement.
    *   **Restriction**: Autorisé uniquement s'il n'y a aucun participant.
6.  **Voir les participants**: `GET /api/v1/draws/:id/participants`
    *   Renvoie une liste paginée des participants.

### C. Application Mobile (Utilisateur)
*Méthode d'Auth : Header `Authorization: Bearer <Custom_JWT>`*

1.  **Obtenir la liste des tirages**: `GET /api/v1/draws?business_id=...`
    *   Nécessite l'ID du commerce (obtenu via `default_business` dans la réponse de connexion).
2.  **Participer au tirage**: `POST /api/v1/draws/:id/participants`
    *   **Logique**: 
        *   Vérifie la participation en double (garanti par l'index unique de la base de données).
        *   Vérifie automatiquement les conditions de tirage (ex: nombre de participants atteint) après la participation.
        *   Si les conditions sont remplies, **déclenche immédiatement le tirage** et renvoie le résultat dans la réponse.
3.  **Voir les détails**: `GET /api/v1/draws/:id`
    *   **Logique de chargement paresseux (Lazy Load)**: Chaque fois que les détails sont demandés, le système vérifie si la "date fixe" est passée. Si elle est passée et que le tirage n'a pas eu lieu, il **déclenche automatiquement le tirage**.

---

## 3. Logique Métier et Code

1.  **Logique de Validation**:
    *   Suppression de certaines validations mathématiques strictes pour `winning_probability` car ce n'est plus un champ de contrôle de probabilité central dans la logique métier actuelle.
    *   Conservation des validations de base (ex: Titre, Type sont requis).

2.  **Nettoyage des Redondances**:
    *   Nettoyage de l'ancien code de "gagnant instantané" dans `participants.ts` et unification pour utiliser la logique `checkAndCompleteDraw` dans `draw-service.ts`. Cela garantit la centralisation de la logique et évite de maintenir deux ensembles de code de tirage.

3.  **Optimisations**:
    *   Introduction du mécanisme `X-Business-ID`, découplant complètement le flux de test sans connexion du tableau de bord restaurant du JWT du système utilisateur.
    *   Ajout de la logique pour modifier et annuler les tirages, en appliquant la condition préalable "aucun participant".
