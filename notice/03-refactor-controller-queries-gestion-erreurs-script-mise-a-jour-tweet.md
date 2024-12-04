# 03-refactor-controller-queries-gestion-erreurs-script-update-and-delete-tweet

## Refactorisation avec contrôleurs et queries

Comme on ne va pas utiliser d'api, on va refactoriser notre code pour utiliser des contrôleurs et des queries et supprimer nos routes api.

### Suppression des routes api

#### suppression de routes/api.js

#### Déplacer et renommer notre routes/api/tweets.js en routes/tweets.js

#### on supprime les routes api dans routes/index.js et on ajoute les routes tweets

```js
const tweetsRouter = require("./tweets");

// router.use("/api", apiRouter);
router.use("/tweets", tweetsRouter);
```

#### suppression des routes de l'index dans routes/index.js et ajout dans le router tweets

On va tout de même conserver notre ancienne route "/" et on va la rediriger vers la route tweets

routes/index.js

```js
const router = require("express").Router();
const tweetsRouter = require("./tweets");

router.use("/tweets", tweetsRouter);

router.get("/", (req, res) => {
  res.redirect("/tweets");
});

module.exports = router;
```

et toutes les routes restantes pour le moment sont dans routes/tweets.js
On va les refactor après en envoaynt dans les controllers et queries.

```js
const router = require("express").Router();
const Tweet = require("../database/models/tweet.model");

router.post("/", (req, res) => {
  const body = req.body;
  const newTweet = new Tweet(body);

  newTweet
    .save()
    .then((tweet) => {
      res.redirect("/");
    })
    .catch((err) => {
      const errors = Object.keys(err.errors).map(
        (key) => err.errors[key].message
      );
      res
        .status(400)
        .render("layout", { content: "tweets/tweet-form", errors: errors });
    });
});

router.get("/", (req, res) => {
  Tweet.find({})
    .sort({ createdAt: -1 })
    .then((tweets) => {
      res.render("layout", { content: "tweets/tweet-list", tweets: tweets });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

router.get("/tweet/new", (req, res) => {
  res.render("layout", { content: "tweets/tweet-form", errors: undefined });
});

module.exports = router;
```

### Refactorisation des routes en controllers et queries

Création des répertoires et fichiers suivants :

- controllers/tweets.controller.js
- queries/tweets.queries.js

#### fichier routes/tweets.js

```js
const router = require("express").Router();
const {
  tweetCreate,
  tweetList,
  tweetNew,
} = require("../controllers/tweets.controller");

router.post("/", tweetCreate);

router.get("/", tweetList);

router.get("/tweet/new", tweetNew);

module.exports = router;
```

#### fichier queries/tweets.queries.js

```js
const Tweet = require("../database/models/tweet.model");

exports.getTweets = async () => {
  return await Tweet.find({}).sort({ createdAt: -1 });
};

exports.createTweet = async (tweet) => {
  const newTweet = new Tweet(tweet);
  return newTweet.save();
};
```

#### fichier controllers/tweets.controller.js

```js
const { getTweets, createTweet } = require("../queries/tweets.queries");

exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getTweets();
    res.render("layout", { content: "tweets/tweet-list", tweets: tweets });
  } catch (err) {
    next(err);
  }
};

exports.tweetNew = async (req, res, next) => {
  res.render("layout", { content: "tweets/tweet-form", errors: undefined });
};

exports.tweetCreate = async (req, res, next) => {
  try {
    await createTweet(req.body);
    res.redirect("/tweets");
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      (key) => err.errors[key].message
    );
    res.status(400).render("layout", {
      content: "tweets/tweet-form",
      errors: errors,
    });
  }
};
```

## Gestion d'erreurs

### Définition de 2 environnements possibles

- environnement de développement
- environnement de production

On remplace les variables d'environnement dans package.json

Pour windows :

```json
  "dev": "set NODE_ENV=development && node --watch-path=./ app.js",
  "prod": "set NODE_ENV=production && node --watch-path=./ app.js"
```

Pour Unix/Mac :

```json
  "dev": "NODE_ENV=development node --watch-path=./ app.js",
  "prod": "NODE_ENV=production node --watch-path=./ app.js"
```

Si vous souhaitez changer .env en .env.prod ou .env.dev sur windows, vous pouvez le faire en créant le fichier nodemon.json

```json
{
  "watch": ["*.env*", "./"],
  "ext": "js,json,env,dev,prod"
}
```

De plus dans app.js il faut configurer nodemon pour surveiller les fichiers .env.prod et .env.dev

```js
require("dotenv").config(); // Charger les variables d'environnement au début pour windows
const path = require("path");

const envFile =
  process.env.NODE_ENV.trim() === "production" ? ".env.prod" : ".env.dev";
require("dotenv").config({ path: path.join(__dirname, envFile) });
```

### ajout de la gestion des erreurs dans app.js avec le middleware express.errorHandler

On installe le package errorhandler

```bash
npm install errorhandler
```

On ajoute le middleware dans app.js

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
const port = process.env.PORT || 3000;

// configuration du moteur de template
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

## Suppression d'un tweet

Objectif: Quand l'utilisateur supprime un tweet on ne va pas reload toutes la page mais juste la partie tweet concernée.

### Ajout de la route de suppression dans routes/tweets.js

```js
router.delete("/:tweetId", tweetDelete);
```

### Ajout de la méthode de suppression dans controllers/tweets.controller.js

```js
exports.tweetDelete = async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    await deleteTweet(tweetId);
    res.redirect("/tweets");
  } catch (err) {
    next(err);
  }
};
```

### refactor views

On renomme tweet-list.ejs en tweets.ejs

On change le content dans le method tweetList du controller tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getTweets();
    res.render("layout", { content: "tweets/tweets", tweets: tweets });
  } catch (err) {
    next(err);
  }
};
```

On créer un views/tweets/partials/tweet-list.ejs et on l'include dans tweets.ejs

views/tweets/tweets.ejs

```html
<div class="container">
  <script src="/javascripts/tweets/tweets.js"></script>

  <!-- Section gauche : Profil -->
  <aside class="profile-section"><%- include("../includes/profile") %></aside>

  <!-- Section centrale : Liste des tweets -->
  <%- include("partials/tweet-list") %>
</div>
```

views/tweets/partials/tweet-list.ejs

```html
<!-- Section centrale : Liste des tweets -->
<main class="tweet-list" id="tweet-list-container">
  <!-- Liste des tweets -->
  <h1>Derniers posts</h1>
  <% if (tweets && tweets.length > 0) { %>
  <ul>
    <!-- Exemple de tweets pour structure -->
    <% tweets.forEach(function (tweet) { %>
    <li class="tweet-item">
      <h2>Nom auteur</h2>
      <p><%= tweet.content %></p>
    </li>
    <% }); %>
  </ul>
  <% } else { %>
  <p>Aucun tweet trouvé</p>
  <% } %>
</main>
```

### Ajout de la méthode de suppression dans queries/tweets.queries.js

```js
exports.deleteTweet = async (id) => {
  return await Tweet.findByIdAndDelete(id);
};
```

### Modification controller tweetDelete

Maintenant que nous avons crée un partial avec la liste des tweets, on va pouvoir modifier la méthode tweetDelete pour ne pas recharger la page mais juste la partie tweet concernée.

controllers/tweets.controller.js

```js
exports.tweetDelete = async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    await deleteTweet(tweetId);
    // res.redirect("/tweets");
    // on renvoi plutôt un partial de la liste des tweets
    const tweets = await getTweets();
    res.render("tweets/partials/tweet-list", {
      tweets: tweets,
    });
  } catch (err) {
    next(err);
  }
};
```

### Création du script de suppression + import du script

On crée un fichier public/javascripts/tweets/tweets.js

On l'improte dans notre view tweets/tweets.ejs

```html
<div class="container">
  <script src="/javascripts/tweets/tweets.js"></script>

  <!-- Section gauche : Profil -->
  <aside class="profile-section"><%- include("../includes/profile") %></aside>
  <!-- Liste des tweets -->
  <%- include("partials/tweet-list") %>
</div>
```

Adaptation de l'affichage des tweets pour ajouter un bouton delete. Sur chaque bouton delete on ajoute un attribut data-tweet-id avec l'id du tweet afin de le récupérer facilement dans le script.

views/tweets/partials/tweet-list.ejs

```html
<main class="tweet-list" id="tweet-list-container">
  <h1>Derniers posts</h1>
  <% if (tweets && tweets.length > 0) { %>
  <ul>
    <% tweets.forEach(function (tweet) { %>
    <li class="tweet-item">
      <h2>Nom auteur</h2>
      <p><%= tweet.content %></p>
      <div class="tweet-actions">
        <button
          type="button"
          class="btn btn-danger delete-tweet"
          data-tweet-id="<%= tweet._id %>"
        >
          Delete
        </button>
        <button
          type="button"
          class="btn btn-primary update-tweet"
          data-tweet-id="<%= tweet._id %>"
        >
          Update
        </button>
      </div>
    </li>
    <% }); %>
  </ul>
  <% } else { %>
  <p>Aucun tweet trouvé</p>
  <% } %>
</main>
```

Création du script tweets.js dans public/javascripts/tweets/tweets.js pour la gestion de la suppression d'un tweet

> une personne mal intentionné pourrait récupérer la liste des id dans le html et lancer une requête manuellement pour delete tous les id. On ajoutera une protection côté serveur plus tard quand on va gérer les sessions et les tokens. De plus avec le CORS on pourrait limiter les requêtes à notre domaine.

public/javascripts/tweets/tweets.js

```js
window.addEventListener("DOMContentLoaded", () => {
  const deleteButtonsElements = document.querySelectorAll(".btn-danger");

  deleteButtonsElements.forEach((button) => {
    button.addEventListener("click", () => {
      const tweetId = button.dataset.tweetId;
      fetch(`/tweets/${tweetId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete tweet");
          }
          // on reçois la liste des tweets au format HTML
          return response.text();
        })
        .then((data) => {
          // on remplace le contenu de la div tweet-list-container par la liste des tweets
          document.getElementById("tweet-list-container").innerHTML = data;
        })
        .catch((error) => {
          console.error("Error deleting tweet:", error);
        });
    });
  });
});
```

### Correction de l'ajout de tweet suite au refactor des routes et views

correction de la route dans routes/tweets.js

```js
router.get("/new", tweetNew);
```

correction du lien dans views/includes/topbar.ejs

```html
<a href="/tweets/new" class="topbar__button-link">
  <button class="topbar__button">Poster</button>
</a>
```

correction du form dans views/tweets/tweet-form.ejs

```html
<form action="/tweets" method="POST"></form>
```

### correction event Listener dans tweets.js

On a un problème: Quand on delete un tweet, la listes des tweets mis à jour n'a plus de listener.
Donc on va mettre notre fonction d'écoute des boutons de façon séparée afin de pouvoir l'appeler à nouveau après l'appel à la requête delete.

public/javascripts/tweets/tweets.js

```js
window.addEventListener("DOMContentLoaded", () => {
  bindTweet();
});

function bindTweet() {
  const deleteButtonsElements = document.querySelectorAll(".btn-danger");

  deleteButtonsElements.forEach((button) => {
    button.addEventListener("click", () => {
      const tweetId = button.dataset.tweetId;
      fetch(`/tweets/${tweetId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete tweet");
          }
          // on reçois la liste des tweets au format HTML
          return response.text();
        })
        .then((data) => {
          // on remplace le contenu de la div tweet-list-container par la liste des tweets
          document.getElementById("tweet-list-container").innerHTML = data;
          bindTweet();
        })
        .catch((error) => {
          console.error("Error deleting tweet:", error);
        });
    });
  });
}
```

## Update d'un tweet

On va utiliser la page d'ajout de formulaire pour l'update.
On va commencer par créer une route pour la page d'update.

routes/tweets.js

```js
router.get("/edit/:tweetId", tweetEdit);
```

On va créer la method correspondante dans le controller tweets.controller.js. On va rendre le même formulaire que pour l'ajout mais avec les données pré-remplies.
Besoin de connaître le tweet à éditer.

Création de la méthode getTweetById dans queries/tweets.queries.js

```js
exports.getTweetById = async (id) => {
  return await Tweet.findById(id);
  // ou Tweet.findOne({ _id: id });
};
```

controllers/tweets.controller.js

```js
exports.tweetEdit = async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const tweet = await getTweetById(tweetId);
    res.render("layout", {
      content: "tweets/tweet-form",
      tweet: tweet,
      errors: undefined,
    });
  } catch (err) {
    next(err);
  }
};
```

Maintenant du côté de notre formulaire (view) il faut que l'on exploite le tweet pour pré-remplir le formulaire.

views/tweets/tweet-form.ejs

```html
<form action="/tweets" method="POST">
  <label for="content">Contenu</label>
  <textarea id="content" name="content" rows="3" required>
    <%= tweet ? tweet.content : "" %>
  </textarea>
</form>
```

Comme on ajouter la variable tweet dans le render, il faut la définir dans le controller "galement pour le create.

controllers/tweets.controller.js

```js
xports.tweetNew = async (req, res, next) => {
  res.render("layout", {
    content: "tweets/tweet-form",
    errors: undefined,
    tweet: undefined,
  });
};
```

Dans tweets/partials/tweet-list.ejs, on avait déjà crée un bouton Update avec un attribut data-tweet-id.
On va ajouter un lien vers la route edit avec l'id du tweet.

views/tweets/partials/tweet-list.ejs

```html
<button
  type="button"
  class="btn btn-primary update-tweet"
  data-tweet-id="<%= tweet._id %>"
  onclick="window.location.href='/tweets/edit/<%= tweet._id %>'"
>
  Update
</button>
```

On va devoir faire la distinction dans notre formulaire entre un call pour la création et pour l'update.
L'action va être différente selon si le tweet à un id ou pas.
On va conserver la méthode post car c'est plus simple à gérer dans un formulaire (la méthode n'est pas possible via le bouton update). Et dans notre route update on va faire un update avec la méthode put.
On change aussi le texte du titre et tu bouton selon si on est en mode edition ou creation.

views/tweets/tweet-form.ejs

```html
<section class="tweet-form-section">
  <h1><%= tweet?._id ? "Modifier un tweet" : "Ecrire un tweet" %></h1>
  <form
    action="<%= tweet?._id ? `/tweets/update/${tweet._id}` : "/tweets" %>"
    method="POST"
  >
    <label for="content">Contenu</label>
    <textarea id="content" name="content" rows="3" required>
<%= tweet ? tweet.content : '' %></textarea
    >
    <div>
      <% if (errors !== undefined && errors.length > 0) { %>
      <div class="error-message" id="contentError">
        <% errors.forEach(function (error) { %>
        <p class="error-text"><%= error %></p>
        <% }) %>
      </div>
      <% } %>
    </div>
    <button type="submit"><%= tweet?._id ? "Modifier" : "Poster" %></button>
  </form>
</section>
```

On ajoute maintenant une route pour l'update dans routes/tweets.js

```js
router.post("/update/:tweetId", tweetUpdate);
```

On va définir cette méthod dans notre controller tweets.controller.js
S'il y a une erreur on va renvoyer le formulaire avec les erreurs et le tweet pour pré-remplir le formulaire.
On sort tweetId et body du try-catch pour qu'ils soient disponibles dans le catch. S'il y a des erreurs sur la déclaration de ces constantes, et comme ce sont des erreurs syncrhones elles seront attrapées dans le middleware errorHandler.

L'autre avantage c'est que cela évite de refaire un appel à la méthode getTweetById pour récupérer le tweet. De plus, le tweet retourné en cas d'erreur au formulaire contiendra déjà les données que l'utilisateur à rempli avant de tenter l'update.

controllers/tweets.controller.js

```js
exports.tweetUpdate = async (req, res, next) => {
  const tweetId = req.params.tweetId;
  const body = req.body;
  try {
    await updateTweet(tweetId, body);
    res.redirect("/tweets");
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      (key) => err.errors[key].message
    );
    // const tweet = await getTweetById(tweetId);
    const tweet = { _id: tweetId, ...body };
    res.status(400).render("layout", {
      content: "tweets/tweet-form",
      tweet: tweet,
      errors: errors,
    });
  }
};
```

On crée maintenant la méthode updateTweet dans queries/tweets.queries.js
On ne demande pas le retour du tweet mis à jour car on ne l'utilise pas vu que l'on retournera sur la liste des tweets.

Par default avec Mongoose, les méthods update n'utilisent pas les validateurs de mongoose. Donc on peut renvoyer le body sans validation.

```js
exports.updateTweet = async (id, body) => {
  return await Tweet.findByIdAndUpdate(id, body, { runValidators: true });
};
```
