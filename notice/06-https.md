# HTTPS et Mise en production

## HTTPS refactor

On crée un folder ssl pour y mettre nos certificats locaux.
Atention de bien vérifier le .gitignore

> Rappel: on va utiliser mkcert pour créer nos certificats locaux et un CA.
> création d'un CA: mkcert -install
> création de nos certificats: mkcert localhost dans le repertoire ssl
> on va avoir 2 fichiers: localhost-key.pem (clé privée) et localhost.pem (certificat)

On ajoute le chemin de nos certificats dans nos fichiers .env.dev et .env.prod (on laisse "" pour le moment)
CERT_PATH="./ssl/localhost.pem"
KEY_PATH="./ssl/localhost-key.pem"

On va créer un folder environment avec un fichier dev.js et prod.js
On pourrait aussi les faire en json mais on va les faire en js pour pouvoir y ajouter du code.

/environment/development.js

On va créer des key qui seront réutilisables dans les autres fichiers.
On va notamment y ajouter notre clé privée et notre certificat pour le serveur https.

```js
const path = require("path");

module.exports = {
  dbUrl: process.env.ATLAS_URI,
  cert: process.env.CERT_PATH,
  key: process.env.KEY_PATH,
};
```

idem pour prod.

/environment/production.js

```js
module.exports = {
  dbUrl: process.env.ATLAS_URI,
  cert: process.env.CERT_PATH,
  key: process.env.KEY_PATH,
};
```

On va utiliser production ou development selon l'environnement.
On pourrait d'ailleurs créer un module qui exporte notre config en fonction de l'environnement.

/environment/config.js

```js
const env = process.env.NODE_ENV.trim();

module.exports = require(`./${env}`);
```

Et par exemple dans /database/index.js on importe notre config et l'utilise pour la connexion à la base de données à la place de process.env.DB_URL

```js
const mongoose = require("mongoose");
const config = require("../environment/config");

mongoose
  .connect(config.dbUrl)
  .then(() => {
    console.log("Connexion base de donnée ok");
  })
  .catch((err) => {
    console.log("Erreur de connexion à la base de donnée :", err);
  });
```

On rajoute des clés port HTTP et HTTPS dans nos fichiers .env.dev et .env.prod
On les ajoute ensuite dans nos fichiers environment/development.js et environment/production.js

.env.dev

```bash
HTTP_PORT=3000
HTTPS_PORT=3001
```

.env.prod

```bash
HTTP_PORT=80
HTTPS_PORT=443
```

On transfert le port dans bin/www

/bin/www

```js
const fs = require("fs");
const https = require("https");
const http = require("http");
const app = require("../app");
const config = require("../environment/config");

// on laisse un http classique pour pouvoir tester la connexion avec google
// http.createServer(app).listen(config.httpPort, () => {
//   console.log(`http server running on port ${config.httpPort}`);
// });

http
  .createServer((req, res) => {
    console.log(`https://${req.headers.host}${req.url}`);
    console.log("config.httpPort", config.httpPort);
    console.log("config.httpsPort", config.httpsPort);
    res.writeHead(301, {
      Location: `https://${req.headers.host}${req.url}`,
    });
    res.end();
  })
  .listen(config.httpPort, () => {
    console.log(`http server running on port ${config.httpPort}`);
  });

const httpsServer = https
  .createServer(
    {
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert),
    },
    app
  )
  .listen(config.httpsPort, () => {
    console.log(`https server running on port ${config.httpsPort}`);
  });
```

On change notre export de l'app en un module.exports.
On n'utilise plus les ports dans app.js et on supprime le listen.
Comme on change notre export de l'app on va devoir modifier notre import de app dans session.config et passport.config.

```js
// const { app } = require("./app")
const app = require("../app");
```

app.js

```js
require("dotenv").config(); // Charger les variables d'environnement au début pour windows
const path = require("path");

const envFile =
  process.env.NODE_ENV.trim() === "production" ? ".env.prod" : ".env.dev";
require("dotenv").config({ path: path.join(__dirname, envFile) });

const express = require("express");
const morgan = require("morgan");
const index = require("./routes/index");
require("./database");
const errorHandler = require("errorhandler");
const app = express();
module.exports = app;

// configuration du moteur de template
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

require("./config/session.config");
require("./config/passport.config");

// configuration des fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// configuration des middlewares globaux
app.use(morgan("short"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// définitions de nos routes
app.use(index);

// gestion des erreurs
if (process.env.NODE_ENV.trim() === "development") {
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    const statusCode = err.status || 500;

    res.status(statusCode).json({
      code: err.code || statusCode,
      message: statusCode === 500 ? null : err.message,
    });
  });
}

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
```

On modifie les scripts dans package.json

```json
"dev": "set NODE_ENV=development && node --watch --watch-preserve-output ./bin/www",
"prod": "set NODE_ENV=production && node --watch --watch-preserve-output ./bin/www"
```

> Comme on est en https, notre connexion via google ne fonctionne plus.
> Car notre certificat n'est pas reconnu par google.

J'ai laissé un serveur http classique pour pouvoir tester la connexion avec google dans le www mais qui est commenté.
On pourrait également modifier les scripts pour choisir http ou https avec env:http ou env:https.

package.json

```json
{
  "scripts": {
    "dev:https": "set NODE_ENV=development && set SERVER_MODE=https && node --watch --watch-preserve-output ./bin/www",
    "dev:http": "set NODE_ENV=development && set SERVER_MODE=http && node --watch --watch-preserve-output ./bin/www",
    "prod": "set NODE_ENV=production && node --watch --watch-preserve-output ./bin/www"
  }
}
```

Ensuite dans le www on choisirai le serveur http selon l'environnement.

/bin/www

```js
const fs = require("fs");
const https = require("https");
const http = require("http");
const app = require("../app");
const config = require("../environment/config");

if (process.env.SERVER_MODE === "http") {
  // Mode HTTP pour tester Google OAuth
  http.createServer(app).listen(config.httpPort, () => {
    console.log(`HTTP server running on port ${config.httpPort}`);
  });
} else {
  // Mode HTTPS par défaut
  http
    .createServer((req, res) => {
      res.writeHead(301, {
        Location: `https://${req.headers.host}${req.url}`,
      });
      res.end();
    })
    .listen(config.httpPort, () => {
      console.log(`HTTP redirect server running on port ${config.httpPort}`);
    });

  const httpsServer = https
    .createServer(
      {
        key: fs.readFileSync(config.key),
        cert: fs.readFileSync(config.cert),
      },
      app
    )
    .listen(config.httpsPort, () => {
      console.log(`HTTPS server running on port ${config.httpsPort}`);
    });
}
```

> si on lance le projet avec https il faut penser que notre port https choisi dans le .env est 3001 et non 3000.

Une autre alternative serait d'utiliser un tunnel ssl pour pouvoir tester notre application en https y compris avec google.

https://ngrok.com/

package.json

```json
{
  "scripts": {
    "dev:https": "set NODE_ENV=development && set SERVER_MODE=https && node --watch --watch-preserve-output ./bin/www",
    "dev:http": "set NODE_ENV=development && set SERVER_MODE=http && node --watch --watch-preserve-output ./bin/www",
    "dev:tunnel": "node ./bin/dev-tunnel.js",
    "prod": "set NODE_ENV=production && node --watch --watch-preserve-output ./bin/www"
  }
}
```

Ajouter une variable BASE_URL dans le .env.dev
Mais l'adresse de ngrok change à chaque démarrage sauf avec un compte payant.

.env.dev

```bash
BASE_URL=https://<ngrok-url>
```

/bin/dev-tunnel.js

```js
const ngrok = require("ngrok");
const { spawn } = require("child_process");

async function startTunnel() {
  try {
    // Démarrer le serveur Node
    const server = spawn("node", ["./bin/www"], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "development",
        SERVER_MODE: "http",
      },
      shell: true,
    });

    // Attendre un peu que le serveur démarre
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Démarrer le tunnel ngrok
    const url = await ngrok.connect(3000);

    console.log("\n-----------------------------------");
    console.log("Ngrok tunnel démarré sur:", url);
    console.log("\nA mettre à jour dans .env.dev :");
    console.log(`BASE_URL=${url}`);
    console.log("\nA mettre à jour dans Google Console :");
    console.log(`${url}/auth/google/callback`);
    console.log("-----------------------------------\n");

    // Gestion de la fermeture propre
    process.on("SIGINT", async () => {
      console.log("\nFermeture du tunnel et du serveur...");
      await ngrok.kill();
      server.kill();
      process.exit(0);
    });
  } catch (err) {
    console.error("Erreur lors du démarrage:", err);
    process.exit(1);
  }
}

startTunnel();
```

test@gmail.com
test

henriteinturier@gmail.com
test

essai@gmail.com
test

//TODO gérer l'erreur quand un utilisateur veut se connecter avec un email et qu'il n'existe pas de password dans la bdd: si l'utilisateur est trouvé c'est que c'est un utilisateur qui est connecté avec un compte google. Donc le spécifier à l'utilisateur. Cet email doit se connecter avec un compte goolgle.
