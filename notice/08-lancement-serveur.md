# Lancement du Serveur en Production

## Introduction à PM2

PM2 est un gestionnaire de processus pour Node.js qui offre plusieurs fonctionnalités essentielles :

- **Lancer et maintenir le serveur actif** : PM2 surveille votre application et la relance automatiquement si elle plante ou si le serveur redémarre
- **Load balancing** : Permet de répartir la charge entre plusieurs instances de votre application pour une meilleure performance.
  _Note : Dans notre cas, avec une seule instance de l'application, le load balancing n'est pas nécessaire. Cette fonctionnalité devient utile lorsque vous lancez plusieurs instances de votre application pour gérer une charge importante. Nous allon sy revenir dans le dernier chapitre_
- **Hot reloading** : Recharge automatiquement l'application lors des modifications de code sans interruption de service
- **Gestion des erreurs** : Capture et journalise les erreurs, permet de définir des actions en cas de crash

### Commandes PM2 Essentielles

- `pm2 startup` : Configure PM2 pour démarrer automatiquement au boot du système
- `pm2 list` : Affiche la liste des applications gérées par PM2
- `pm2 logs [app-name]` : Affiche les logs en temps réel
- `pm2 restart [app-name]` : Redémarre une application
- `pm2 kill` : Arrête tous les processus gérés par PM2
- `pm2 stop [app-name]` : Arrête une application
- `pm2 delete [app-name]` : Supprime une application de PM2
- `pm2 monit` : Interface de monitoring en temps réel
- `pm2 save` : Sauvegarde la liste des processus pour les restaurer après un redémarrage

## Installation et Configuration de PM2

### Installation

L'installation se fait globalement via npm :

```bash
npm install -g pm2
```

### Configuration du Démarrage Automatique

Cette commande est à exécuter une seule fois après l'installation pour permettre à PM2 de démarrer automatiquement avec le système :

```bash
pm2 startup
```

_Note : PM2 pourrait suggérer une commande spécifique à exécuter avec sudo pour finaliser la configuration_

### Configuration des Variables d'Environnement

#### 1. Protection des Données Sensibles

Ajoutez le fichier de configuration dans .gitignore pour ne pas exposer vos variables sensibles :

```bash
# Ajouter dans .gitignore
ecosystem.config.js
```

#### 2. Création du Template de Configuration

Ce fichier servira de modèle pour la configuration réelle :
On aurait aussi pu faire un pm2 init pour créer ce fichier mais nous allons le faire manuellement pour comprendre le fonctionnement.

```js:ecosystem.config.exemple.js
module.exports = {
  apps: [
    {
      name: "X-Clone",
      script: "./bin/www",
      env: {
        NODE_ENV: "production",
        ATLAS_URI: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        SESSION_SECRET: "",
        CERT_PATH: "",
        KEY_PATH: "",
        HTTP_PORT: "",
        HTTPS_PORT: "",
      },
    },
  ],
};
```

## Scripts NPM pour la Gestion du Serveur

Ajoutez ces scripts dans votre package.json pour faciliter la gestion du serveur :

```json:package.json
"scripts": {
    "vps": "pm2 start ecosystem.config.js && pm2 save",     # Démarre l'application et sauvegarde la configuration
    "logs": "pm2 logs X-Clone",                            # Affiche les logs
    "vps:stop": "pm2 stop X-Clone",                        # Arrête l'application
    "vps:restart": "pm2 restart X-Clone"                   # Redémarre l'application
}
```

## Gestion des Ports Privilégiés

### Comprendre les Ports Privilégiés

Sur les systèmes Unix/Linux, les ports en dessous de 1024 sont considérés comme "privilégiés" et nécessitent des droits root pour être utilisés. C'est une mesure de sécurité historique :

- Ports 0-1023 : ports privilégiés, nécessitent des droits root
- Ports 1024-65535 : ports non privilégiés, utilisables par les utilisateurs normaux

C'est pourquoi nous utilisons :

- Port 8080 au lieu de 80 (HTTP)
- Port 8443 au lieu de 443 (HTTPS)

## Configuration des Permissions LetsEncrypt

### Pourquoi Configurer les Permissions ?

Par défaut, les certificats SSL de Let's Encrypt sont accessibles uniquement par root pour des raisons de sécurité. Cependant, notre application Node.js s'exécute sous un utilisateur non-root (ubuntu dans notre cas). Pour permettre à notre application d'accéder aux certificats tout en maintenant la sécurité, nous devons :

1. Créer un groupe dédié
2. Donner à ce groupe les permissions de lecture nécessaires
3. Ajouter notre utilisateur à ce groupe

### Configuration Complète des Permissions

```bash
# Créer le groupe
sudo groupadd letsencrypt

# Configurer les permissions des dossiers parents
sudo chown root:letsencrypt /etc/letsencrypt/archive
sudo chown root:letsencrypt /etc/letsencrypt/live
sudo chmod 750 /etc/letsencrypt/archive
sudo chmod 750 /etc/letsencrypt/live

# Configurer les permissions des dossiers spécifiques au domaine
sudo chown root:letsencrypt /etc/letsencrypt/archive/vps-henri.ovh
sudo chown root:letsencrypt /etc/letsencrypt/live/vps-henri.ovh
sudo chmod 750 /etc/letsencrypt/archive/vps-henri.ovh
sudo chmod 750 /etc/letsencrypt/live/vps-henri.ovh

# Configurer les permissions des fichiers
sudo chown root:letsencrypt /etc/letsencrypt/archive/vps-henri.ovh/privkey1.pem
sudo chown root:letsencrypt /etc/letsencrypt/archive/vps-henri.ovh/fullchain1.pem
sudo chown root:letsencrypt /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
sudo chown root:letsencrypt /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem

# Configurer les permissions de lecture
sudo chmod 640 /etc/letsencrypt/archive/vps-henri.ovh/privkey1.pem
sudo chmod 640 /etc/letsencrypt/archive/vps-henri.ovh/fullchain1.pem
sudo chmod 640 /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
sudo chmod 640 /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem

# Ajouter l'utilisateur au groupe
sudo usermod -a -G letsencrypt ubuntu
```

_Note importante : La configuration des dossiers parents est cruciale car Linux vérifie les permissions à chaque niveau de l'arborescence. Si un dossier parent n'a pas les bonnes permissions, l'accès sera refusé même si le fichier final a les bonnes permissions._

## Vérification des Permissions

Après avoir configuré les permissions, il est nécessaire de se reconnecter pour que les changements de groupe prennent effet :

```bash
# Se déconnecter et se reconnecter
exit
ssh ubuntu@tonvps

# Tester l'accès aux fichiers
ls -l /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
cat /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
```

## Configuration des Ports et Redirections

### Modification de la Redirection HTTPS

Pour gérer correctement la redirection avec les ports personnalisés :
En effet, dans la version précédente, la redirection ne prenait pas en compte le changement de port entre Http et https.

```js:bin/www
res.writeHead(301, {
  Location: `https://${req.headers.host.split(":")[0]}:${config.httpsPort}${req.url}`,
});
```

### Configuration des Redirections de Ports

Pour permettre l'utilisation des ports standards sans droits root, nous utilisons iptables pour rediriger le trafic :

```bash
# Rediriger les ports standards vers les ports personnalisés
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8443

# Gestion des règles iptables
sudo iptables -t nat -L --line-numbers  # Voir les règles existantes
sudo iptables -t nat -D PREROUTING <numéro>  # Supprimer une règle spécifique
```

## Configuration Google OAuth

### URLs à Configurer dans la Console Google

Pour permettre l'authentification Google avec et sans les ports personnalisés, vous devez configurer les URLs suivantes dans la console développeur Google :

**Authorised JavaScript origins :**

- https://vps-henri.ovh:8443 // si pas de redirection
- https://vps-henri.ovh

**Authorised redirect URIs :**

- https://vps-henri.ovh:8443/auth/google/callback // si pas de redirection
- https://vps-henri.ovh/auth/google/callback

_Note : Ces configurations sont nécessaires pour que l'authentification Google fonctionne à la fois avec les ports explicites (8443) et avec la redirection depuis les ports standards._

### Vérification Finale

Après avoir effectué toutes ces configurations :

1. Votre application devrait démarrer automatiquement avec le système
2. Les certificats SSL devraient être accessibles
3. Les redirections de ports devraient fonctionner
4. L'authentification Google devrait fonctionner avec ou sans les ports explicites

Pour vérifier que tout fonctionne :

```bash
# Vérifier le statut de PM2
pm2 list

# Vérifier les logs
pm2 logs X-Clone

# Vérifier les redirections de ports
sudo iptables -t nat -L
```

## Load Balancing et pm2 script

L'idée est de pouvoir lancer plusieurs instance de l'application selon le nombre de coeur de la machine. Notre VPS en l'occurence ne posède qu'un coeur.
Mais nous allons voir comment faire en supposant que nous avions plusieurs coeurs.
Le load balancing est un système qui permet de répartir la charge entre plusieurs serveurs. L'idéal est donc de lancer autant d'instance de node que de coeur.

Reprenons notre fichier ecosystem.config.js
Nous pouvons ajouter quelques paramètres supplémentaires pour gérer le load balancing.

instances: 2 (ou "max" pour utiliser tout les coeurs) // Nombre d'instance à lancer. pm2 utilisera automatiquement le load balancing avec 2 instances.
autorestart: true // Redémarre les instances en cas de crash mais doit être couplé avec un pm2 restart.
watch: true // Surveille les changements dans les fichiers et recharge automatiquement les fichiers modifiés. Mais cela consomme plus de ressource.

```js:ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "X-Clone",
      script: "./bin/www",
      instances: "max",
      autorestart: true,
      watch: true,
      env: {
        NODE_ENV: "production",
        ATLAS_URI: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        SESSION_SECRET: "",
        CERT_PATH: "",
        KEY_PATH: "",
        HTTP_PORT: "",
        HTTPS_PORT: "",
      },
    },
  ],
};
```

## Bonus : Cron Job

Il faut renouveller le certificat SSL tous les 3 mois. certbot à généré automatiquement un cron job dans le fichier /etc/cron.d/certbot
Les cron job sont gérés par le système de cron de linux.
ils permettent de lancer des scripts à des intervalles réguliers.

Si certbot n'avait pas généré de cron job, il est possible de le faire manuellement ce cette façon :

On peut déjà lister les cron job déjà présent avec la commande :

```bash
sudo crontab -l
```

Mais on ne verra pas celui mis en place de certbot car il est dans le fichier /etc/cron.d/certbot. On ne le voit pas car il est dans un autre fichier que celui géré par crontab.

Pour éditer le fichier de cron job, il faut se rendre dans le dossier :

```bash
sudo nano /etc/crontab
```

On peut ensuite ajouter notre cron job. Il est constitué de 5 éléments séparés par des espaces :

- Minutes (0-59)
- Heures (0-23)
- Jours (1-31)
- Mois (1-12)
- Jours de la semaine (0-7)

Voici le cronjob que certbot a généré automatiquement :

```bash
0 */12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew --no-random-sleep-on-renew
```

Analysons ce cron job :

- `0 */12 * * *` : S'exécute toutes les 12 heures
- `root` : Exécuté en tant que root
- `test -x /usr/bin/certbot -a \! -d /run/systemd/system` : Vérifie que certbot est exécutable et que systemd n'est pas en cours d'initialisation
- `perl -e 'sleep int(rand(43200))'` : Ajoute un délai aléatoire jusqu'à 12 heures pour éviter que tous les serveurs renouvellent en même temps
- `certbot -q renew` : Renouvelle silencieusement les certificats si nécessaire
- `--no-random-sleep-on-renew` : Désactive le délai aléatoire supplémentaire pendant le renouvellement
