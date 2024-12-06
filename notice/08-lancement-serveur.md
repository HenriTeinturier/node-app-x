# Lancement du serveur

Nous allons lancer notre serveur en mode production et y faire quelques modifications.
Pour envoyer et stocker nos variables d'environnements nous avons plusieurs options:

- Ajouter un fichier .env.prod dans le dossier root et y mettre nos variables.
- On peut ajouter nos variables dans .bashrc ou .zshrc et les charger dans notre script bin/www.

Nos allons opter pour une autre solution: nous allons utiliser pm2 pour lancer notre serveur.

pm2 c'est un gestionnaire de processus pour node.
Il va nous permettre de lancer notre serveur et de le maintenir actif.
De plus il va nous permettre de faire du load balancing, du hot reloading, de gérer les erreurs, etc.

Pour installer pm2:

```bash
npm install -g pm2
```

On va lancer la commande pm2 startup pour que pm2 se lancer au démarrage de la machine. Il n'y a besoin de faire cette commande qu'une fois.

```bash
pm2 startup
```

pm2 proposera peut être une commande à lancer pour qu'il puisse s'exécuter au démarrage.

Nous allons créer un fichier ecosystem.config.js dans le dossier root pour y rentrer nos variables d'environnements.
Dans notre repo github on ne pousse pas ce fichier donc on l'ajoute dans .gitignore.

```.gitignore
ecosystem.config.js
```

On va créer un fichier ecosystem.config.exemple.js
Ce fichier va nous servir de base pour la configuration de pm2.

```js
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

Sur notre vps il faudra dupliquer ce fichier en ecosystem.config.js et y rentrer nos variables d'environnements.

```bash
cp ecosystem.config.exemple.js ecosystem.config.js
```

On peut ensuite mettre les variables d'environnements dans le fichier ecosystem.config.js avec nano ou votre éditeur de code préféré.

```bash
nano ecosystem.config.js
```

Pour sauvegarder et quitter nano:

```bash
CTRL + O // pour sauvegarder
CTRL + X // pour quitter
```

Nous allons créer un nouveau scrypt pour notre vps dans le package.json:

```json
"scripts": {
    "vps": "pm2 start ecosystem.config.js && pm2 save",
    "logs": "pm2 logs X-Clone",
    "vps:stop": "pm2 stop X-Clone",
    "vps:restart": "pm2 restart X-Clone"
}
```

Ensuite on peut lancer notre serveur en mode production avec la commande:

```bash
npm run vps
```

Problème d'autorisation de lecture des fichiers letsencrypt:
Ceci est lié à OVH car de base nous n'avons pas les droits de lecture sur les fichiers letsencrypt avec notre utilisateur.

Voici la procédure à suivre pour créer un group letsencrypt puis ajouter les fichiers dans ce group et y ajouter notre utilisateur: (l'utilisateur ici c'est ubuntu)

1. Créer un group letsencrypt:

```bash
sudo groupadd letsencrypt
```

2. Ajouter les fichiers dans le group letsencrypt:

```bash
sudo chown root:letsencrypt /etc/letsencrypt/archive/vps-henri.ovh/privkey1.pem
sudo chown root:letsencrypt /etc/letsencrypt/archive/vps-henri.ovh/fullchain1.pem
sudo chown root:letsencrypt /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
sudo chown root:letsencrypt /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem
```

Donner les permissions de lecture au group letsencrypt:

```bash
sudo chmod 640 /etc/letsencrypt/archive/vps-henri.ovh/privkey1.pem
sudo chmod 640 /etc/letsencrypt/archive/vps-henri.ovh/fullchain1.pem
sudo chmod 640 /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
sudo chmod 640 /etc/letsencrypt/live/vps-henri.ovh/fullchain.pem
```

3. Ajouter notre utilisateur au group letsencrypt:

```bash
sudo usermod -a -G letsencrypt ubuntu
```

Reconnecter et reconnexion à la machine.

```bash
exit
ssh ubuntu@tonvps
```

Tester l'accès aux fichiers letsencrypt:

```bash
ls -l /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
cat /etc/letsencrypt/live/vps-henri.ovh/privkey.pem
```

Relancer le serveur:

```bash
pm2 restart X-Clone
```

J'avais plusieurs problème:
Les ports 80 et 443 ne sont pas accessible en l'état sur mon vps.

J'ai donc du changer les ports:
HTTP: 8080
HTTPS: 8443

De plus la redirection ne prenait pas en compte le changement de port entre Http et https j'ai donc du remplacer dans le fichier bin/www:

```js
res.writeHead(301, {
  Location: `https://${req.headers.host.split(":")[0]}:${config.httpsPort}${
    req.url
  }`,
});
```

J'ai également du ajouter pour la connexion google Authorised redirect URIs
https://vps-henri.ovh:8443/auth/google/callback

Et Authorised JavaScript origins
https://vps-henri.ovh:8443

Et tout est enfin ok

Bon par contre du coup dans l'adresse de vps pour le moment je dois mettre le port:
https://vps-henri.ovh:8443
