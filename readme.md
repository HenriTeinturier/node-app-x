# X Clone - Projet d'Apprentissage Node.js et Express

Ce projet est un clone de X (anciennement Twitter) développé pour apprendre et maîtriser Node.js et Express. Il intègre plusieurs technologies et concepts avancés pour offrir une application web complète.

## Guide d'Apprentissage

Le projet est accompagné de notices détaillées (dans le dossier `/notice`) qui permettent de reproduire le projet étape par étape depuis zéro. Ces notices sont numérotées et couvrent tous les aspects du développement :

1. Initialisation du projet
2. Gestion des tweets avec MongoDB et Mongoose
3. Refactorisation et gestion des erreurs
4. Authentification
5. Protection des routes et gestion des profils
6. HTTPS et sécurité
7. Configuration VPS et GitHub
8. Lancement du serveur en production
9. Recherche et suivi d'utilisateurs
10. Validation par email et réinitialisation de mot de passe

## Technologies Utilisées

- **Node.js & Express** : Pour le développement du serveur et des API.
- **MongoDB & Mongoose** : Pour la gestion de la base de données, avec MongoDB Atlas pour l'hébergement.
- **Passport** : Pour la gestion des sessions et l'authentification, incluant la connexion via Google OAuth.
- **Nodemailer** :
  - Sparkpost en production pour l'envoi d'emails
  - Mailtrap en développement pour tester les fonctionnalités d'email
- **Multer** : Pour la gestion des fichiers, permettant aux utilisateurs de choisir un avatar.
- **HTTPS** : Configuration pour sécuriser les communications.
- **Architecture MVC** : Pour une séparation claire des responsabilités dans le code.
- **Middlewares** : Pour protéger les routes et gérer les accès.

## Fonctionnalités

- **Authentification** : Connexion avec des identifiants classiques ou via Google OAuth.
- **Gestion des utilisateurs** : Création, modification, suppression de comptes, et gestion des avatars.
- **Gestion des tweets** : Création, lecture, mise à jour et suppression de tweets.
- **Système de suivi** : Suivre et ne plus suivre d'autres utilisateurs.
- **Envoi d'emails** : Validation de l'email lors de l'inscription et réinitialisation du mot de passe.
- **Interface utilisateur** : Utilisation de SweetAlert pour des notifications élégantes.

## Librairies Complémentaires

- **SweetAlert** : Pour des alertes et notifications interactives.
- **Day.js** : Pour la gestion des dates et heures.
- **UUID** : Pour la génération de tokens uniques.
- **Bcrypt** : Pour le hachage des mots de passe.

## Installation et Lancement

1. **Cloner le dépôt** :

   ```bash
   git clone https://github.com/HenriTeinturier/node-app-x.git
   cd node-app-x
   ```

2. **Installer les dépendances** :

   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** : Créez un fichier `.env` avec les configurations nécessaires (voir `.env.example`).

4. **Lancer le serveur** :

   ```bash
   npm run dev:http
   ```

5. **Accéder à l'application** : Ouvrez votre navigateur et allez à `http://localhost:3000`.

## Déploiement

Le projet est configuré pour être déployé sur un VPS avec PM2 pour la gestion des processus. Les certificats SSL sont gérés avec Let's Encrypt.

## Configuration des Emails

### Développement

- Utilisation de Mailtrap pour tester l'envoi d'emails en environnement de développement
- Configuration facile via les credentials Mailtrap dans les variables d'environnement

### Production

- Utilisation de Sparkpost pour l'envoi réel d'emails
- Configuration via les API keys Sparkpost dans les variables d'environnement

## Contribution

Les contributions sont les bienvenues. Veuillez soumettre une pull request pour toute amélioration ou correction.

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
