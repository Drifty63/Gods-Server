# 🎮 GODS Game Server - Guide de Déploiement

Ce guide explique comment déployer le serveur multijoueur en ligne.

---

## 🚀 Option 1 : Déploiement sur Render (Recommandé - Gratuit)

### Prérequis

- Un compte GitHub avec votre code pushé
- Un compte Render (gratuit) : <https://render.com>

### Étapes

#### 1. Pusher le code sur GitHub

```bash
git add .
git commit -m "Add online multiplayer server"
git push origin main
```

#### 2. Créer le service sur Render

1. Allez sur <https://dashboard.render.com>
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre compte GitHub si ce n'est pas fait
4. Sélectionnez votre repository `gods-card-game`

#### 3. Configurer le service

Remplissez les champs suivants :

| Champ | Valeur |
|-------|--------|
| **Name** | `gods-game-server` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | *(laisser vide)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install socket.io` |
| **Start Command** | `node server-online.js` |
| **Instance Type** | `Free` |

#### 4. Lancer le déploiement

Cliquez sur **"Create Web Service"** et attendez ~2-3 minutes.

#### 5. Récupérer l'URL

Une fois déployé, vous aurez une URL comme :

```
https://gods-game-server.onrender.com
```

#### 6. Configurer le frontend

Créez un fichier `.env.local` à la racine du projet :

```
NEXT_PUBLIC_SOCKET_URL=https://gods-game-server.onrender.com
```

---

## 🌐 Option 2 : Déploiement sur Railway

1. Allez sur <https://railway.app>
2. Créez un nouveau projet depuis GitHub
3. Railway détectera automatiquement le `render.yaml` ou configurez :
   - **Start Command** : `node server-online.js`
   - **Port** : sera automatiquement assigné

---

## 🛠️ Développement Local

### Lancer les deux serveurs en parallèle

**Terminal 1 - Frontend Next.js :**

```bash
npm run dev
```

**Terminal 2 - Serveur de jeu :**

```bash
npm run server
```

Le frontend sera sur `http://localhost:3000`
Le serveur de jeu sera sur `http://localhost:3001`

---

## 🔧 Configuration des Variables d'Environnement

### Pour Vercel (Frontend)

1. Allez dans les settings de votre projet Vercel
2. Section "Environment Variables"
3. Ajoutez :
   - **Key** : `NEXT_PUBLIC_SOCKET_URL`
   - **Value** : `https://gods-game-server.onrender.com`

### Pour le développement local

Créez `.env.local` :

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 📊 Monitoring

### Vérifier que le serveur fonctionne

Accédez à `/health` sur votre serveur :

```
https://gods-game-server.onrender.com/health
```

Réponse attendue :

```json
{
  "status": "ok",
  "games": 0,
  "players": 0,
  "queue": 0
}
```

---

## ⚠️ Notes Importantes

### Render Free Tier

- Le serveur **s'endort après 15 minutes d'inactivité**
- Premier appel peut prendre ~30 secondes (cold start)
- Pour éviter ça, passez au plan payant ($7/mois)

### Limites

- Le serveur garde les parties en mémoire
- Si le serveur redémarre, les parties en cours sont perdues
- Pour une solution plus robuste, utiliser Redis

---

## 🎯 Résumé Rapide

1. Push sur GitHub
2. Créer Web Service sur Render
3. Build: `npm install socket.io`
4. Start: `node server-online.js`
5. Copier l'URL générée
6. Ajouter `NEXT_PUBLIC_SOCKET_URL` dans Vercel
7. C'est prêt ! 🎮
