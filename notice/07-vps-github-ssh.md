# VPS - Github - SSH

## Création du repo GitHub

Nom de mon repo : `node-app-x`

Dans le répertoire du projet, exécutez les commandes suivantes pour initialiser un dépôt Git local, le connecter à GitHub et y pousser vos modifications :

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/HenriTeinturier/node-app-x
git branch -M main
git push -u origin main
```

### Explications des commandes

1. **git init**  
   Initialise un dépôt Git dans le répertoire courant. Cela permet de commencer à gérer les versions du projet.

2. **git add .**  
   Ajoute tous les fichiers (et sous-dossiers) au suivi de Git. Le point `.` signifie que tous les fichiers du répertoire courant seront inclus.

3. **git commit -m "Initial commit"**  
   Enregistre un instantané des fichiers suivis dans le dépôt local avec un message de description. Ici, le message `"Initial commit"` indique qu'il s'agit du premier commit.

4. **git remote add origin https://github.com/HenriTeinturier/node-app-x**  
   Configure l’URL du dépôt GitHub comme dépôt distant, appelé `origin`. Cela lie votre dépôt local au dépôt GitHub.

5. **git branch -M main**  
   Renomme la branche principale en `main`, ce qui est la convention moderne pour les projets Git.

6. **git push -u origin main**  
   Envoie les modifications locales vers le dépôt distant (`origin`) sur la branche principale (`main`).  
   Le drapeau `-u` associe la branche locale `main` avec le dépôt distant, permettant de simplifier les futures commandes `git push` et `git pull`.

### Résultat attendu

Après ces étapes, votre code sera visible sur GitHub dans le dépôt `node-app-x`. Vous pourrez continuer à utiliser `git push` pour envoyer des modifications et `git pull` pour récupérer les mises à jour du dépôt distant.

## Connexion VPS par SSH

avec ssh:

root est le nom d'utilisateur par défaut pour la connexion SSH mais votre VPS peut avoir un autre nom d'utilisateur.
suivi de l'ip4 de la VPS.

exemple:

```bash
ssh root@192.168.1.100
```

Il faudra renseigner le mot de passe de la VPS.
Si c'est la première connexion il faudra probablement créer un nouveau mot de passe.

Sur mon serveur j'ai déjà ubuntu d'installé.

Quelques commandes utiles:

```bash
pwd # pour voir le répertoire courant
lsb_release -a # pour voir la version de linux
sudo apt update # pour mettre à jour la liste des paquets
sudo apt upgrade # pour mettre à jour les paquets
```

## Installation de Node.js

On va utiliser curl pour telecharger node.js. puis l'installer avec nvm.
nvm permet de changer de version de node.js plus facilement.

[nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)

> attention après le curl il faudra probablement relancer le terminal.

```bash
# installs nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
# download and install Node.js (you may need to restart the terminal)
nvm install 22
# verifies the right Node.js version is in the environment
node -v # should print `v22.12.0`
# verifies the right npm version is in the environment
npm -v # should print `10.9.0`
```

Quelques commandes utiles avec nvm:

```bash
nvm use 22 # pour utiliser la version 22 de node.js
nvm install --lts # pour installer la dernière version LTS de node.js
nvm list # pour voir les versions de node.js installées
nvm install version # pour installer une version spécifique de node.js
nvm alias default 22 # pour définir la version par défaut de node.js à chaque nouveau terminal
```
