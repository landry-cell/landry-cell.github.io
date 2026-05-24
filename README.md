# 2heures17 - Plateforme d'écoute et de bienveillance

2heures17 est une plateforme web destinée aux jeunes en détresse émotionnelle, offrant un espace sécurisé pour parler, se ressourcer et trouver de l'aide.

## Fonctionnalités
- Écoute psychologique anonyme
- Chat privé en temps réel avec des bénévoles
- Détection automatique de crise
- Bouton SOS d'urgence
- Journal émotionnel et exercices anti-stress
- Administration complète

## Installation

1. Cloner le projet
2. Installer les dépendances :
   ```bash
   pip install -r requirements.txt
   ```
3. Configurer le fichier `.env`.
4. Lancer le serveur :
   ```bash
   python app.py
   ```
   Le site sera accessible sur `http://localhost:8008`.

## Déploiement

### Vercel
Le projet est configuré pour Vercel via `vercel.json`. 
1. Poussez le projet sur GitHub (sans le dossier `temp_lib` et sans la base de données `.db`).
2. Connectez votre dépôt à Vercel.
3. Configurez les variables d'environnement sur Vercel :
   - `SECRET_KEY` : Une chaîne aléatoire longue.
   - `DATABASE_URL` : L'URL de votre base de données PostgreSQL (ex: `postgres://user:pass@host:5432/dbname`).
   - `SMTP_USER`, `SMTP_PASSWORD` : Pour les alertes SOS par email.

**Note importante :** SQLite est déconseillé sur Vercel car les données sont perdues à chaque redémarrage. L'utilisation d'une `DATABASE_URL` (PostgreSQL) est fortement recommandée. Les WebSockets ne sont pas nativement supportés par les fonctions Serverless de Vercel.

## Stack Technique
- Frontend: HTML5, CSS3, JS Vanilla
- Backend: Python FastAPI, SQLAlchemy, WebSockets
- Base de données: SQLite (Local) / PostgreSQL (Production)
- Sécurité: JWT, Bcrypt, SlowAPI
