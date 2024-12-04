# Authentification - Refactor tweets avec authentification

Ajout du systeme d'authentification.
Pour les tweets ils seront atribués à un utilisateur. Seul le propriétaire pourra les modifier ou les supprimer.

## Preparation authentification

on install express-session, de bcrypt, connect-mongo,passport

-express-session pour la gestion de la session
-bcrypt pour hasher les passwords
-connect-mongo pour utiliser mongo comme store pour les sessions
-passport pour la gestion de l'authentification

```bash
npm install express-session connect-mongo bcrypt passport
```

Suite à l'ajjout de ces packages, j'ai du modifier mon fichier package.json car le watch path estimait que des éléments étaient mis à jour et relancait le serveur en permanence.

Voici les scripts modifiés:

```json
"dev": "set NODE_ENV=development && node --watch --watch-preserve-output app.js",
"prod": "set NODE_ENV=production && node --watch --watch-preserve-output app.js"
```

## Configuration de la session

Création de la configuration dans le fichier `config/session.config.js`

On ajoute un secret dans les variables d'environnement.

```
SESSION_SECRET=""
```

On configure la session dans le fichier `config/session.config.js`

```js
const { app } = require("../app");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { app } = require("../app");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false, // ne pas sauvegarder la session si elle n'a pas été modifiée
    saveUninitialized: false, // ne pas créer de session si elle n'a pas de données
    cookie: {
      httpOnly: false, // ne pas autoriser l'accès au cookie via le javascript du client
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semaine
    },
    store: MongoStore.create({
      // créer un store pour les sessions
      client: mongoose.connection.getClient(), // récupérer la connexion à la base de données déjà existante
      ttl: 14 * 24 * 60 * 60, // 14 jours
    }),
  })
);
```

On importe le fichier de configuration dans le fichier `app.js`

```js
// on exporte l'app pour pouvoir l'utiliser dans les autres fichiers
exports.app = app;

require("./config/session.config");
```

## Ajout de l'inscription

En effet, l'inscription ne necessite pas encore passport. On va avoir besoin de créer notre model User. On ajoute un champs pour google que l'on ajotuera par la suite.

### Création du model User

database/models/user.model.js

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  local: {
    password: { type: String },
  },
  google: {
    id: {
      type: String,
    },
  },
});

// Middleware de validation
userSchema.pre("validate", function (next) {
  if (!this.local.password && !this.google.id) {
    next(new Error("Un mot de passe ou un Google ID est requis."));
  } else {
    next();
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Création de la route d'inscription

On appel notre router users dans le fichier `routes/index.js`
Au passage on remodifie le nom du fichier pour les tweets: `tweets.route.js`

routes/users.route.js

```js
const router = require("express").Router();
const tweetsRouter = require("./tweets.routes");
const usersRouter = require("./users.routes");

router.use("/tweets", tweetsRouter);
router.use("/users", usersRouter);

router.get("/", (req, res) => {
  res.redirect("/tweets");
});

module.exports = router;
```

Ensuite on crée les routes d'inscription dans le fichier `routes/users.routes.js`

- `/signup/form` pour afficher le formulaire d'inscription
- `/signup` pour traiter le formulaire d'inscription

On importe tout de suite les controllers associés que l'on va créer juste après.

routes/users.routes.js

```js
const router = require("express").Router();
const { signupForm, signup } = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);

module.exports = router;
```

### Création des controllers et views

controllers/users.controller.js

Le formulaire pourrait être dans une branche users ou dans une branch auth.

signupForm : afficher le formulaire d'inscription

```js
exports.signupForm = (req, res, next) => {
  res.render("layout", { content: "users/user-form", errors: null });
};
```

views/users/user-form.ejs

```html
<main class="signup-section">
  <h1>Inscription</h1>

  <!-- gestion des erreurs -->
  <% if (errors) { %>
  <div class="error-message">
    <% if (Array.isArray(errors)) { %> <% errors.forEach(function (err) { %>
    <p class="error-text"><%= err %></p>
    <% }); %> <% } else { %>
    <p class="error-text"><%= errors %></p>
    <% } %>
  </div>
  <% } %>

  <!-- formulaire d'inscription -->
  <form action="/users/signup" method="POST" class="signup-form">
    <label for="username">Nom d'utilisateur</label>
    <input
      type="text"
      id="username"
      name="username"
      placeholder="Entrez votre nom d'utilisateur"
      required
    />

    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      placeholder="Entrez votre email"
      required
    />

    <label for="password">Mot de passe</label>
    <input
      type="password"
      id="password"
      name="password"
      placeholder="Entrez votre mot de passe"
      required
    />

    <button type="submit">S'inscrire</button>
  </form>

  <!-- bouton pour s'inscrire avec Google -->
  <button type="button" class="google-signup" onclick="">
    S'inscrire avec Google
  </button>
</main>
```

Et le style dans le fichier `main.css`

```css
/* code existant */
/* Section d'inscription */
.signup-section {
  max-width: 600px;
  width: 90%;
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  text-align: center;
}

.signup-section h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.signup-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.signup-form input {
  width: 100%;
  max-width: 580px;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.signup-form button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.signup-form button:hover {
  background-color: #0d8bdb;
}

.signup-form button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.signup-form button:hover {
  background-color: #0d8bdb;
}

/* Bouton "S'inscrire avec Google" */
.google-signup {
  margin-top: 20px;
  background-color: #4285f4; /* Bleu Google */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%; /* Largeur totale du conteneur */
  max-width: 580px; /* Largeur maximale */
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.google-signup:hover {
  background-color: #357abd; /* Version plus foncée du bleu Google */
}

/* Compatibilité avec la classe dans le formulaire */
.signup-form .google-signup {
  background-color: #4285f4; /* Bleu Google */
  color: white;
}

.signup-form .google-signup:hover {
  background-color: #357abd;
}
```

On va maintenant créer le controller pour la route `/signup` ainsi que les queries necessaires.

controllers/users.controller.js

signup : traiter le formulaire d'inscription

```js
exports.signup = async (req, res, next) => {
  const body = req.body;
  try {
    await createUser(body);
    // TODO LOGGUER L'utilisateur
    // pour le moment on redirige vers l'accueil
    res.redirect("/");
  } catch (error) {
    res.render("layout", {
      content: "users/user-form",
      errors: [error.message],
    });
  }
};
```

queries/users.queries.js

```js
const User = require("../database/models/user.model");

exports.createUser = async (user) => {
  try {
    const hashedPassword = await User.hashPassword(user.password);

    const newUser = new User({
      username: user.username,
      email: user.email,
      local: {
        password: hashedPassword,
      },
    });
    return newUser.save();
  } catch (error) {
    throw error;
  }
};
```

Ajout des methods de hashage et de comparaison de password dans notre model User.

database/models/user.model.js

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  local: {
    password: { type: String },
  },
  google: {
    id: {
      type: String,
    },
  },
});

// Middleware de validation
userSchema.pre("validate", function (next) {
  if (!this.local.password && !this.google.id) {
    next(new Error("Un mot de passe ou un Google ID est requis."));
  } else {
    next();
  }
});

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 12); // 12 est le nombre de salt rounds
};

const User = mongoose.model("User", userSchema);

module.exports = User;
```

Ajout d'un bouton pour accéder à la page d'inscription dans notre topbar.

views/includes/topbar.ejs

```html
<ul class="topbar__menu">
  <li class="topbar__item">
    <a href="/users/signup/form" class="topbar__link">S'inscrire</a>
  </li>
</ul>
```

On va tester l'inscription de notre user.

## Ajout de l'authentification/connexion

### Mise en place des routes et controllers

On créer un nouveau router pour les routes d'authentification.

On commence par le déclarer dans le fichier `routes/index.js`

routes/index.js

```js
const router = require("express").Router();
const tweetsRouter = require("./tweets.routes");
const usersRouter = require("./users.routes");
const authRouter = require("./auth.routes");
router.use("/tweets", tweetsRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.get("/", (req, res) => {
  res.redirect("/tweets");
});

module.exports = router;
```

On créer le fichier `routes/auth.routes.js`

routes/auth.routes.js

Dans ce routeur on va avoir besoin des routes suivantes:

- `/signin/form` pour afficher le formulaire de connexion
- `/signin` pour traiter le formulaire de connexion
- `/signout` pour se déconnecter

```js
const router = require("express").Router();
const {
  signinForm,
  signin,
  signout,
} = require("../controllers/auth.controller");

router.get("/signin/form", signinForm);
router.post("/signin", signin);
router.get("/signout", signout);

module.exports = router;
```

On créer maintenant ces methodes dans le fichier `controllers/auth.controller.js`

controllers/auth.controller.js

```js
exports.signinForm = (req, res, next) => {
  res.end("signinForm");
};

exports.signin = (req, res, next) => {
  res.end("signin");
};

exports.signout = (req, res, next) => {
  res.end("signout");
};
```

### Mise en place de passport et de l'authentification

On créer un fichier de configuration dans le dossier `config`
Avant on install passport-local

```bash
npm install passport-local
```

config/passport.config.js

```js
const { app } = require("../app");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { findUserByEmail, findUserById } = require("../queries/users.queries");
const User = require("../database/models/user.model");

app.use(passport.initialize()); // initialisation obligatoire

app.use(passport.session()); // utilisation des sessions avec passport

// Après l'authentification nous ne stockons que l'_id du user
// dans la session pour ne pas la surcharger
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// A chaque requête, la session est récupérée par express-session en utilisant
// l'id de la session dans le cookie. Passport récupère l'_id du user dans la session
// et exécute cette méthode. Nous récupérons le user avec son _id et le retournons
// à Passport avec done(null, user). Passport le mettra alors sur req.user
passport.deserializeUser(async (_id, done) => {
  try {
    const user = await findUserById(_id);

    if (!user) {
      return done(null, false, {
        message: "Utilisateur non trouvé dans la session",
      });
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Configuration de la stratégie locale
// Nous utilisons l'email comme identifiant et devons donc passer
// l'option usernameField
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Utilisateur non trouvé" });
        }

        const match = await user.comparePassword(password);

        if (!match) {
          return done(null, false, { message: "Mot de passe incorrect" });
        }

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);
```

On l'importe dans le fichier `app.js`

app.js

```js
require("./config/passport.config");
```

Création des queries pour l'authentification. On les mets aussi dans users.queries.js mais on aurait pu les séparer dans auth.queries.js

queries/users.queries.js

```js
exports.findUserByEmail = async (email) => {
  return User.findOne({ email });
};

exports.findUserById = async (_id) => {
  return User.findById(_id);
};
```

Création de comparePassword dans le model User

database/models/user.model.js

```js
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.local.password);
};
```

### Mise en place des formulaires de connexion et des controllers

On va commencer par notre formulaire de connexion:

controllers/auth.controller.js

On configure aussi le signout au passage.

```js
exports.signinForm = (req, res, next) => {
  res.render("layout", { content: "auth/auth-form", errors: null });
};

exports.signout = (req, res, next) => {
  // req.logout est une méthode de passport et necessite un callback
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/signin/form");
  });
};
```

Notre formulaire de connexion se trouve dans le fichier `views/auth/auth-form.ejs`

views/auth/auth-form.ejs

```html
<main class="signup-section">
  <h1>Connexion</h1>

  <!-- gestion des erreurs -->
  <% if (errors) { %>
  <div class="error-message">
    <% if (Array.isArray(errors)) { %> <% errors.forEach(function (err) { %>
    <p class="error-text"><%= err %></p>
    <% }); %> <% } else { %>
    <p class="error-text"><%= errors %></p>
    <% } %>
  </div>
  <% } %>

  <!-- formulaire de connexion -->
  <form action="/auth/signin" method="POST" class="signup-form">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      placeholder="Entrez votre email"
      required
    />

    <label for="password">Mot de passe</label>
    <input
      type="password"
      id="password"
      name="password"
      placeholder="Entrez votre mot de passe"
      required
    />

    <button type="submit">Se connecter</button>
  </form>

  <!-- bouton pour s'inscrire avec Google -->
  <button type="button" class="google-signup" onclick="">
    Se connecter avec Google
  </button>
</main>
```

Ajouter notre lien dans la topbar

views/includes/topbar.ejs

```html
<ul class="topbar__menu">
  <li class="topbar__item">
    <a href="/auth/signin/form" class="topbar__link">Connexion</a>
  </li>
</ul>
```

On ajoute notre strategie local avec notre controller de connexion.

controllers/auth.controller.js

```js
const passport = require("passport");

exports.signinForm = (req, res, next) => {
  res.render("layout", { content: "auth/auth-form", errors: null });
};

exports.signin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err); // Arrête l'exécution ici
    }

    if (!user) {
      return res.render("layout", {
        content: "auth/auth-form",
        errors: [info.message],
      }); // Arrête l'exécution ici
    }

    return req.login(user, (err) => {
      if (err) {
        return next(err); // Arrête l'exécution ici
      }
      return res.redirect("/tweets"); // Arrête l'exécution ici
    });
  })(req, res, next);
};

exports.signout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/signin/form");
  });
};
```

## Topbar affichage connexion/sincrire/Tweet ... selon connecté ou pas

On va ajouter l'utilisateur et isAuthenticated dans toutes les methodes render dans les controllers.

exemple tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getTweets();
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};
```

On peut maintenant récupérer ces informations dans la topbar afin d'adapter les boutons selon différents scénarios.

- on affiche connexion et inscription si on est pas connecté
- on affiche déconnexion et tweet si on est connecté

views/includes/topbar.ejs

```html
<nav class="topbar__nav">
  <div class="topbar__left">
    <a href="/" class="topbar__brand">
      <img src="/images/X_logo.png" alt="Logo" class="topbar__logo" />
    </a>
  </div>
  <div class="topbar__right">
    <% if (isAuthenticated) { %>
    <a href="/tweets/new" class="topbar__button-link">
      <button class="topbar__button">Poster</button>
    </a>
    <ul class="topbar__menu">
      <li class="topbar__item">
        <a href="/auth/signout" class="topbar__link">Déconnexion</a>
      </li>
    </ul>
    <% } else { %>
    <ul class="topbar__menu">
      <li class="topbar__item">
        <a href="/auth/signin/form" class="topbar__link">Connexion</a>
      </li>
    </ul>
    <ul class="topbar__menu">
      <li class="topbar__item">
        <a href="/users/signup/form" class="topbar__link">S'inscrire</a>
      </li>
    </ul>
    <% } %>
  </div>
</nav>
```

## Tweets mis à jour droits d'accès

On a plusieurs possibilités pour rattaché le model tweet au model user.

- on peut ajouter un champ user dans le model tweet
- on peut ajouter un champ tweet dans le model user

Si l'on doit faire des recherchers dans tweets sans passer par le model user, on peut ajouter un champ user dans le model tweet.
C'est notre cas car nous voudrons afficher les tweets de différents user quand on follow plusieurs users.
Si nous laissions les tweetId dans les users il faudrait ouvrir chaque user pour retrouver les tweets correspondants.
Dans notre cas nous sauvegarderaons simplement un array d'id user qu'un utilisateur follow. Cela permettra de faire une recherche directemen dans le model tweets.

Modification de notre model user.
On va utiliser ref pour faire la relation entre les models user et tweet.
Il sera possible d'utiliser la méthode populate() pour automatiquement remplacer l'id par le document user associé.

database/models/user.model.js

```js
const mongoose = require("mongoose");
const schema = mongoose.Schema;

const tweetSchema = schema({
  content: {
    type: String,
    maxlength: [140, "Tweet trop long"],
    minlength: [1, "Tweet trop court"],
    required: [true, "Tweet manquant"],
  },
  author: {
    type: schema.Types.ObjectId,
    ref: "user",
    required: [true, "Auteur manquant"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const Tweet = mongoose.model("Tweet", tweetSchema);

module.exports = Tweet;
```

On va maintenant adapter la création du tweet pour ajouter l'auteur et obliger l'utilisateur à être connecté.

On va modifier la method tweetCreate du controller de création de tweet. On ajouter l'\_id de l'utilisateur connecté.

controllers/tweets.controller.js

```js
exports.tweetCreate = async (req, res, next) => {
  try {
    await createTweet(req.body, req.user._id);
    res.redirect("/tweets");
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      (key) => err.errors[key].message
    );
    res.status(400).render("layout", {
      content: "tweets/tweet-form",
      errors: errors,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  }
};
```

Il faut maintenant adapté notre queries createTweet qui va recevoir l'id de l'utilisateur connecté.

queries/tweets.queries.js

```js
exports.createTweet = async (tweet, userId) => {
  return Tweet.create({ ...tweet, author: userId });
};
```

On va maintenant afficher l'auteur du tweet dans la liste des tweets.

On créer une nouvelle queries pour récupérer les tweets avec l'auteur.

queries/tweets.queries.js

```js
exports.getTweetsWithAuthors = async () => {
  return await Tweet.find({})
    .populate("author", "username")
    .sort({ createdAt: -1 });
};
```

On va remplacer notre getTweets par getTweetsWithAuthors dans le controller de liste des tweets car nous voulons afficher l'auteur sur les posts.

controllers/tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getTweetsWithAuthors();
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};
```

Enfin on va afficher l'auteur du tweet dans la view.

views/tweets/partials/tweet-list.ejs

```html
<h2><%= tweet.author.username %></h2>
```

## Connexion automatique après inscription

Il suffit de modifier la méthode signup du controller users.controller.js. Comme passport.session() est activé nous avons accès à req.login() qui permet de connecter l'utilisateur.

controllers/users.controller.js

```js
exports.signup = async (req, res, next) => {
  try {
    const body = req.body;
    const user = await createUser(body);
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (error) {
    res.render("layout", {
      content: "users/user-form",
      errors: [error.message],
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  }
};
```

## Login avec Google

### préparation .env et ackage

Il faut ajouter le GoogleId et le GoogleToken dans les environnements.

.env

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Installation de passport-google-oauth20

```bash
npm install passport-google-oauth20
```

### Ajout de la strategie Google

On commence par préparer la stratégie Google dans le fichier passport.config.js

config/passport.config.js

```js
const GoogleStrategy = require("passport-google-oauth20");

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);

      return done(null, false, { message: "Google login not implemented" });
    }
  )
);
```

### Route et callback pour Google

On créer une route pour la connexion google ("/auth/google").Et une route pour la callback qui recevra le token de google ("/auth/google/callback").

routes/auth.routes.js

```js
router.get("/google", signinWithGoogle);
router.get("/google/callback", signinWithGoogleCallback);
```

On crée les deux méthodes dans le controller auth.controller.js

controllers/auth.controller.js

```js
exports.signinWithGoogle = (req, res, next) => {
  passport.authenticate("google", { scope: ["email", "profile"] })(
    req,
    res,
    next
  );
};

exports.signinWithGoogleCallback = (req, res, next) => {
  passport.authenticate("google", {
    successRedirect: "/tweets",
    failureRedirect: "/auth/signin/form",
  })(req, res, next);
};
```

On va englober notre bouton de connexion google dans la view auth-form.ejs

views/auth/auth-form.ejs

```html
<a href="/auth/google">
  <button type="button" class="google-signup">Se connecter avec Google</button>
</a>
```

### Création et connexion d'un utilisateur Google

On va vérifier si l'utilisateur existe déjà dans la base de données. Si ce n'est pas le cas on va créer un nouvel utilisateur.

On va mettre notre strategie à jour pour rechercher l'utilisateur puis soit one le connecte soit on le crée. Si on le crée on utilisaera le displayName comme username.

config/passport.config.js

```js
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const user = await findUserByEmail(email);

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          username: profile.displayName,
          email: email,
          google: {
            id: profile.id,
          },
        });

        const savedUser = await newUser.save();
        return done(null, savedUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);
```

On va également wrapper le bouton d'inscription avec Google dans la view user-form.ejs

views/users/user-form.ejs

```html
<a href="/auth/google">
  <button type="button" class="google-signup">S'inscrire avec Google</button>
</a>
```
