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
```

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

Réponses: `{ token, user: { id, email, name } }` ou `{ error }`.

Le client stocke le jeton dans `localStorage.token`.

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
