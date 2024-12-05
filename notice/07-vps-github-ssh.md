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

## Configurer une clé SSH pour se connecter à Github

CE n'est pas necessaire si le repo github est public.
Mais c'est une bonne pratique pour sécuriser les accès et permettre des deploiements automatisés.
Cela permettra de communiquer avec github sans avoir à renseigner son login et son mot de passe à chaque fois.

> rappel: Une clé SSH est un couple de clés cryptographiques: une clé publique (que l'on partage avec github) et une clé privée (qui reste secrète sur la VPS).

Création de la clé publique et de la clé privée:

```bash
ssh-keygen -t ed25519 -C "votre.email@example.com"
```

-t: type de la clé (ed25519 est la plus sécurisée actuellement)
-C: commentaire pour identifier la clé

Ce qui se passe:

- un fichier id_ed25519 est créé dans le répertoire ~/.ssh (clé privée)
- un fichier id_ed25519.pub est créé dans le répertoire ~/.ssh (clé publique)

On va ensuite afficher cette clé publique afin de la copier dans github.

```bash
cat ~/.ssh/id_ed25519.pub
```

On va ensuite dans github dans les settings, clés SSH et clés réseaux. On selectionne "New SSH key".
On selectionne un nom: par exemple "vps"
On colle la clé publique copiée et on clique sur "Add SSH key".

[https://github.com/settings/keys](https://github.com/settings/keys)

Une fois la clé ajoutée on peut la tester avec la commande:

```bash
ssh -T git@github.com
```

## Récupérer le repo github sur la VPS

On récupère le repo github avec la commande git clone. Dans notre cas on utilise le lien SSH.

```bash
git clone git@github.com:HenriTeinturier/node-app-x.git
```

## installer les dépendances

On se place dans le répertoire du projet avec cd.

```bash
cd node-app-x
```

On installe les dépendances avec npm install.

```bash
npm install
```

## obtenir un certificat valide pour notre serveur HTTPS

On va utiliser le CA Let's Encrypt pour avoir un certificat SSL/TLS valide pour notre serveur HTTPS. Ce CA est gratuit et valide les certificats pour 90 jours.

On va commencer par créer une clé public et privé du côté de notre serveur.

Ensuite il faut envoyer une requête au CA pour lui dire "Je suis propriétaire de mon nom de domaine... + la clé publique".
CA va nous demander de prouver que nous avons bien la clé privée + de positionner un fichier particulier sur notre serveur afin de valider notre propriété du domaine.
On dit au CA que l'on est prêt et qu'il peut vérifier que nous sommes propriétaire du domaine.
Il va alors nous retourner une clé privée. Avec cette clé privée on peut:

- générer un certificat SSL/TLS valide pour notre serveur HTTPS: requête (csr: certificate signing request)
- rafraichir le certificat SSL/TLS valide pour notre serveur HTTPS: requête (renew)
- annuler le certificat SSL/TLS valide pour notre serveur HTTPS: requête (revoke)

Pour chaque certificat que l'on veut créer (csr) on va devoir créer une paire de clés publiques et privées.
Ensuite on crée la requête (csr) avec la clé privée. On va également signer le tout avec la clé public créer à l'étape 1 et avec la clé privé crée pour ce certificaT.
On va également signer le tout avec la clé privé autorisé du domaine.
Ensuite on envoi à let's Encrypt qui nous revnoi le certificat. Durée de vie 90 jours?

C'est bien compliqué. On va mettre ça en place avec un outils qui va gloablement tout faire pour nous:

### Certbot

Il a des plugins pour nginx, apache, standalone, etc...
Nous on va utiliser le plugin standalone.

Pour installer certbot:

```bash
sudo apt install certbot
```

Pour créer notre certificat:

On va spécifié -d pour le domaine. En général on a 2 domaines associés, par exemple: vps-henri.ovh et www.vps-henri.ovh.
certonly est la commande pour créer un certificat.
standalone est le plugin que l'on va utiliser.

```bash
sudo certbot certonly -d vps-henri.ovh -d www.vps-henri.ovh --standalone
```

On rempli les questions et on valide.

Normalement on a un fichier dans /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem
et un dans /etc/letsencrypt/live/vps-henri.ovh/privkey.pem.

Avec le message suivant:

```bash
Account registered.
Requesting a certificate for vps-henri.ovh and www.vps-henri.ovh

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
This certificate expires on 2025-03-05.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.
```

C'est ce path que nous allon spouvoir utiliser dans notre projet.
On peut donc les ajouter dans notre env.prod

```bash
CERT_PATH="/etc/letsencrypt/live/vps-henri.ovh/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/vps-henri.ovh/privkey.pem"
```

On met à jour le fichier environment/production.js
Et notre fichier environment/production.js

```js
const path = require("path");

module.exports = {
  dbUrl: process.env.ATLAS_URI,
  cert: process.env.CERT_PATH,
  key: process.env.KEY_PATH,
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
};
```
