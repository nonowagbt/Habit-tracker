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

### Notifications par email

L'application peut envoyer des emails de rappel pour les tâches non complétées.

**Configuration SMTP (dans `server/.env`) :**

```bash
ENABLE_EMAIL_NOTIFICATIONS=true
EMAIL_CRON_SCHEDULE=0 9 * * *  # Tous les jours à 9h (format cron)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
```

**Pour Gmail :**
1. Activez la validation en 2 étapes sur votre compte Google
2. Générez un "Mot de passe d'application" : https://myaccount.google.com/apppasswords
3. Utilisez ce mot de passe dans `SMTP_PASS`

**Format du schedule cron :**
- `0 9 * * *` = Tous les jours à 9h
- `0 */6 * * *` = Toutes les 6 heures
- `0 9 * * 1` = Tous les lundis à 9h

Les emails sont envoyés automatiquement aux utilisateurs ayant des tâches non complétées.

### Docker (MongoDB)

Lancer MongoDB localement avec Docker Compose:

```bash
docker compose up -d
```

Accès optionnel à `mongo-express`: `http://localhost:8081`

## Version mobile (PWA)

L'application est disponible en version Progressive Web App (PWA) installable sur mobile.

### Installation sur mobile

**iOS (Safari):**
1. Ouvrez l'application dans Safari
2. Appuyez sur le bouton Partager (icône carrée avec flèche)
3. Sélectionnez "Sur l'écran d'accueil"
4. L'application sera installée comme une app native

**Android (Chrome):**
1. Ouvrez l'application dans Chrome
2. Un popup d'installation peut apparaître automatiquement
3. Sinon, menu du navigateur (⋮) → "Ajouter à l'écran d'accueil"
4. L'application sera installée comme une app native

### Fonctionnalités PWA

- ✅ Installation sur l'écran d'accueil
- ✅ Mode hors ligne (service worker)
- ✅ Mise à jour automatique
- ✅ Interface optimisée pour mobile
- ✅ Support des zones sécurisées (notch)
- ✅ Thème adaptatif (clair/sombre)

### Configuration PWA

Le plugin `vite-plugin-pwa` est configuré pour générer automatiquement :
- Service Worker pour le cache
- Manifest.json pour l'installation
- Icônes PWA (192x192 et 512x512)

Les icônes sont dans `client/public/`. Vous pouvez les remplacer par vos propres icônes.

## Scripts

- `npm run dev`: lance client et server en parallèle
- `npm run build`: build du client (génère aussi les fichiers PWA)
- `npm run start`: démarre uniquement l'API

application that will track your habits (sports, sleep, etc.)
