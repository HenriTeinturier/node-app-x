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

Sur notre vps il faudra renommer ce fichier en ecosystem.config.js et y rentrer nos variables d'environnements.

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
