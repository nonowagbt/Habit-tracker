# Habit-tracker

## Démarrage rapide

Prérequis: Node.js 18+, npm, Docker (optionnel pour MongoDB).

### Installation

```bash
npm install -D concurrently cross-env
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Variables d'environnement

Créer un fichier `.env` dans `server/` avec:

```bash
PORT=4000
MONGODB_URI=mongodb://localhost:27017/habit_tracker
JWT_SECRET=votre_secret_ultra_long
GOOGLE_CLIENT_ID=votre_google_client_id
```

Créer un fichier `.env` dans `client/` avec:

```bash
VITE_GOOGLE_CLIENT_ID=votre_google_client_id
```

**Configuration Google OAuth:**
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API "Google+ API" ou "Google Identity Services"
4. Aller dans "Identifiants" > "Créer des identifiants" > "ID client OAuth 2.0"
5. Configurer l'écran de consentement OAuth si nécessaire
6. Ajouter les URI de redirection autorisés:
   - `http://localhost:5173` (développement)
   - Votre domaine de production
7. Copier le Client ID et l'ajouter dans les fichiers `.env`

### Lancer en développement

Depuis la racine:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Healthcheck: `GET /api/health`

## Authentification

### Endpoints

- POST `/api/auth/register` body: `{ email, password, name? }`
- POST `/api/auth/login` body: `{ email, password }`
- POST `/api/auth/google` body: `{ credential }` (token ID Google)

Réponses: `{ token, user: { id, email, name, picture? } }` ou `{ error }`.

Le client stocke le jeton dans `localStorage.token`.

### Authentification Google

L'application supporte l'authentification via Google OAuth 2.0. Le bouton "Se connecter avec Google" apparaît sur la page de login si `VITE_GOOGLE_CLIENT_ID` est configuré.

### Docker (MongoDB)

Lancer MongoDB localement avec Docker Compose:

```bash
docker compose up -d
```

Accès optionnel à `mongo-express`: `http://localhost:8081`

## Scripts

- `npm run dev`: lance client et server en parallèle
- `npm run build`: build du client
- `npm run start`: démarre uniquement l'API
application that will track your habits (sports, sleep, etc.)
