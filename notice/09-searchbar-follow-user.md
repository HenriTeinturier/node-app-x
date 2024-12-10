# Searchbar, affichage des posts d'un utilisateur et follow user

## Affichage des posts de notre utilisateur et des utilisateurs que l'on suit

Jusque maintenant on affichait tous les posts de tous les utilisateurs.
On va changer ça pour voir seulement les posts de notre utilisateur et les posts des utilisateurs que l'on suit.

On va modifier notre method tweetList pour qu'elle récupère les posts de l'utilisateur et des utilisateurs que l'on suit.

On va devoir adapter notre model user pour y ajouter un array de followers.

On va y ajouter une clé following qui sera un array d'ObjectId.
On y ajoute aussi une valeur par défaut qui sera un array vide.
On y met une référence vers le model user pour que Mongoose sache de quoi sont les ObjectId.
Cela permettra également d'utiliser les méthodes populate de Mongoose.

/database/models/user.model.js

```js
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: { type: String, default: "/images/avatars/default-avatar.png" },
  following: { type: [Schema.Types.ObjectId], ref: "user", default: [] },
  local: {
    password: { type: String },
  },
  google: {
    id: {
      type: String,
    },
  },
});
```

On va créer une query qui va récupérer les posts de l'utilisateur et des utilisateurs que l'on suit.

/queries/tweets.queries.js

```js
exports.getCurrentUserTweetsWithFollowing = async (user) => {
  return await Tweet.find({
    author: { $in: [user._id, ...user.following] },
  })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};
```

Dans notre controller, on va remplacer getTweetsWithAuthors par getCurrentUserTweetsWithAuthors.

/controllers/tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getCurrentUserTweetsWithFollowing(req.user);
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

## Affichage des posts d'un utilisateur

Afin de pouvoir afficher les posts d'un utilisateur, on va devoir créer une query qui va récupérer les posts de cet utilisateur.
On va faire une recherche à partir de son username car comme \_id il est unique.
De plus on aura probablement une url avec /tweets/username pour afficher les posts d'un utilisateur.

/queries/tweets.queries.js

```js
exports.getTweetsFromUsername = async (username) => {
  // nous avons besoin de récupérer l'utilisateur à partir de son username afin de récupérer son _id
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new Error("User not found");
  }

  // en effet, dans le tweet model il n'y a pas le username pour faire une recherche ni l'avatar dont on aura besoin pour la vue
  return await Tweet.find({ author: user._id })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};
```

On va ajouter par la suite une clé supplémentaire pour la vue tweets.ejs pour lui préciser le user à afficher dans la partie profile.

On va ajouter donc ajouter cette clé dans le controller de la route tweets car on en aura besoin pour la route tweets/username/:username.

/controllers/tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getCurrentUserTweetsWithFollowing(req.user);
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
```

On va adapter notre vue profile pour qu'elle affiche le user et non le currentUser.

/views/includes/profile.ejs

```html
<section class="profile">
  <script src="/javascripts/users/profile.js"></script>
  <form
    class="profile-avatar"
    id="profile-avatar-form"
    action="/users/update/avatar"
    method="post"
    enctype="multipart/form-data"
  >
    <input type="file" name="avatar" id="avatar-input" hidden />
    <img
      src="<%= user.avatar || '/images/avatars/default-avatar.png' %>"
      alt="Avatar de username"
      id="image-profile"
    />
  </form>
  <h2><%= user.username %></h2>
  <p class="profile-email"><%= user.email %></p>
  <div class="profile-stats">
    <div class="stat-item">
      <span class="stat-value"><%= tweets.length %></span>
      <span class="stat-label">Tweets</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">120</span>
      <span class="stat-label">Abonnements</span>
    </div>
  </div>
</section>
```

On va maintenant modifier notre view /tweets/partials/tweet-list.ejs pour qu'elle affiche dans les posts les username et avatars des auteurs.

/views/tweets/partials/tweet-list.ejs

```html
<main class="tweet-list" id="tweet-list-container">
  <h1>Derniers posts</h1>
  <% if (tweets && tweets.length > 0) { %>
  <ul>
    <% tweets.forEach(function (tweet) { %>
    <li class="tweet-item">
      <!-- <h2><%= tweet.author.username %></h2> -->
      <div class="tweet-header">
        <img
          src="<%= tweet.author.avatar || '/images/avatars/default-avatar.png' %>"
          alt="Avatar"
          class="tweet-avatar"
        />
        <span class="tweet-username"><%= tweet.author.username %></span>
      </div>
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
          onclick="window.location.href='/tweets/edit/<%= tweet._id %>'"
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

Et ajouter ceci dans notre main.css

```css
.tweet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.tweet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.tweet-username {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
```

Comme on va pouvoir afficher les tweets des autres utilisateurs on va afficher les boutons de delete et update uniquement si l'utilisateur est le créateur du tweet.

On va ajouter une variable "editable" dans notre controller afin de préciser si oui ou non on peut afficher les boutons de delete et update.
De plus dans la views on va vérifier si editable est true et si le currentUser est le créateur du tweet.

/controllers/tweets.controller.js

```js
exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getCurrentUserTweetsWithFollowing(req.user);
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
      user: req.user,
      editable: true,
    });
  } catch (err) {
    next(err);
  }
};
```

Et dans notre vue tweets/partials/tweet-list.ejs

/views/tweets/partials/tweet-list.ejs

```html
<main class="tweet-list" id="tweet-list-container">
  <h1>Derniers posts</h1>
  <% if (tweets && tweets.length > 0) { %>
  <ul>
    <% tweets.forEach(function (tweet) { %>
    <li class="tweet-item">
      <div class="tweet-header">
        <img
          src="<%= tweet.author.avatar || '/images/avatars/default-avatar.png' %>"
          alt="Avatar"
          class="tweet-avatar"
        />
        <span class="tweet-username"><%= tweet.author.username %></span>
      </div>
      <p><%= tweet.content %></p>
      <% if (editable && tweet.author._id.toString() ===
      currentUser._id.toString()) { %>
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
          onclick="window.location.href='/tweets/edit/<%= tweet._id %>'"
        >
          Update
        </button>
      </div>
      <% } %>
    </li>
    <% }); %>
  </ul>
  <% } else { %>
  <p>Aucun tweet trouvé</p>
  <% } %>
</main>
```

On doit modifier les methods dans le controller tweetDelete afin d'utiliser la query getCurrentUserTweetsWithFollowing et non pas getTweets.
On doit également passer editable à true dans le render de la route tweetList.

/controllers/tweets.controller.js

```js
exports.tweetDelete = async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    await deleteTweet(tweetId);
    // res.redirect("/tweets");
    // on renvoi plutôt un partial de la liste des tweets
    const tweets = await getCurrentUserTweetsWithFollowing(req.user);
    res.render("tweets/partials/tweet-list", {
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
      editable: true,
    });
  } catch (err) {
    next(err);
  }
};
```

On va maintenant contruire la navigation pour pouvoir rechercher d'autres utilisateurs puis afficher leurs posts.

On va créer une route /user/:username pour afficher la page d'un autre utilisateur.

/routes/users.routes.js

```js
const router = require("express").Router();
const { ensureAuthenticated } = require("../config/guards.config");
const {
  signupForm,
  signup,
  updateAvatar,
  userProfile,
} = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);
router.post("/update/avatar", ensureAuthenticated, updateAvatar);
router.get("/:username", userProfile);

module.exports = router;
```

on va ajouter notre nouvelle methode userProfile dans le controller users.controller.js

/controllers/users.controller.js

```js
exports.userProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    const tweets = await getTweetsFromUsername(username);
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
      user: user,
      editable: false,
    });
  } catch (err) {
    next(err);
  }
};
```

on créer une query pour récupérer un utilisateur par son username

/queries/users.queries.js

```js
exports.getUserByUsername = async (username) => {
  return await User.findOne({ username: username });
};
```

## Barre de recherche utilisateur

On va ajouter un input dans notre topbar pour pouvoir rechercher un utilisateur.

/views/includes/topbar.ejs

```html
<nav class="topbar__nav">
  <!-- Left -->
  <div class="topbar__left">
    <a href="/" class="topbar__brand">
      <img src="/images/X_logo.png" alt="Logo" class="topbar__logo" />
    </a>
  </div>

  <!-- Search -->
  <form class="topbar__search" id="search-input">
    <input
      type="search"
      class="topbar__search-input"
      placeholder="Rechercher un utilisateur..."
      aria-label="Rechercher un utilisateur"
    />
  </form>

  <!-- Right -->
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

Avec le css

```css
/* Reset de base */
body,
h1,
h2,
h3,
p,
ul,
li,
a,
button {
  margin: 0;
  padding: 0;
  list-style: none;
  text-decoration: none;
  color: inherit;
}

body {
  font-family: "Inter", sans-serif;
  line-height: 1.6;
  background-color: #f4f4f9;
  color: #333;
}

/* Conteneur global */
.container {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

/* Barre de navigation (Topbar) */
.topbar__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1d1d1d;
  padding: 10px 20px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.topbar__brand {
  display: flex;
  align-items: center;
}

.topbar__logo {
  width: 40px;
  height: auto;
}

.topbar__right {
  display: flex;
  gap: 30px;
  align-items: center;
}

.topbar__button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.topbar__button:hover {
  background-color: #0d8bdb;
}

.topbar__link {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background-color: transparent;
  border-radius: 12px;
  transition: background-color 0.3s, transform 0.2s;
  cursor: pointer;
}

.topbar__link:hover {
  background-color: rgba(255, 255, 255, 0.1); /* Fond gris clair */
  transform: scale(1.05); /* Légère augmentation de taille */
}

.topbar__link:active {
  transform: scale(1); /* Réduit l'effet au clic */
}

/* Styles pour la barre de recherche */
.topbar__search {
  flex: 0 1 300px;
  margin: 0 20px;
}

.topbar__search-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #2f3336;
  background-color: #202327;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  margin: 0;
}

.topbar__search-input::placeholder {
  color: #6e767d;
}

.topbar__search-input:focus {
  background-color: #000;
  border-color: #1da1f2;
  outline: none;
}

/* Ajustement pour le responsive */
/* Ajustez la section des media queries existante */
@media (max-width: 768px) {
  .topbar__nav {
    flex-wrap: wrap;
    gap: 10px; /* Ajoute un espacement entre les éléments */
  }

  .topbar__left {
    flex: 0 0 auto; /* Empêche le logo de rétrécir */
  }

  .topbar__search {
    flex: 1 1 100%; /* Prend toute la largeur disponible */
    order: 3; /* Place la barre de recherche en dessous */
    margin: 10px 0;
  }

  .topbar__right {
    flex: 0 0 auto; /* Empêche les boutons de rétrécir */
    margin-left: auto; /* Pousse les boutons vers la droite */
  }
}

/* Ajoutez ces styles pour les très petits écrans */
@media (max-width: 480px) {
  .topbar__nav {
    padding: 10px;
  }

  .topbar__right {
    gap: 10px; /* Réduit l'espacement entre les boutons */
  }

  .topbar__button {
    padding: 8px 12px; /* Réduit légèrement la taille du bouton */
  }
}

/* Section centrale : Liste des tweets */
.tweet-list {
  flex: 1;
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tweet-list h1 {
  font-size: 24px;
  margin-bottom: 15px;
}

.tweet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.tweet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.tweet-username {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.tweet-item {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.tweet-item:last-child {
  border-bottom: none;
}

.tweet-item h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.tweet-item p {
  font-size: 16px;
  color: #444;
}

/* Formulaire pour ajouter un tweet */
.tweet-form-section {
  max-width: 600px; /* Largeur maximale sur les grands écrans */
  width: 90%; /* Ajuste la largeur pour petits écrans */
  margin: 20px auto; /* Centre le formulaire horizontalement */
  padding: 20px; /* Ajoute des espaces internes */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box; /* Garantit une largeur cohérente */
}

.tweet-form-section h1 {
  margin-bottom: 20px;
  font-size: 24px;
}

form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

form input,
form textarea {
  width: 100%; /* Utilise toute la largeur du conteneur */
  max-width: 580px; /* Largeur maximale pour les grands écrans */
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box; /* Inclut padding et bordures dans le calcul de la largeur */
}

form button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

form button:hover {
  background-color: #0d8bdb;
}

@media (max-width: 768px) {
  .tweet-form-section {
    width: 95%; /* Utilise presque toute la largeur de l'écran sur tablette */
    padding: 15px; /* Réduit le padding pour conserver de l'espace */
  }

  form input,
  form textarea {
    max-width: 100%; /* Les champs s'adaptent à la largeur disponible */
  }
}

@media (max-width: 480px) {
  .tweet-form-section {
    width: 100%; /* Utilise toute la largeur sur mobile */
    padding: 10px; /* Réduit le padding pour les très petits écrans */
  }

  form input,
  form textarea {
    width: 100%; /* S'étend sur toute la largeur */
    font-size: 12px; /* Réduit légèrement la taille de la police pour un meilleur rendu */
  }

  form button {
    width: 100%; /* Bouton pleine largeur */
    font-size: 14px;
  }
}

/* Gestion des erreurs */
.error-message {
  background-color: #ffe6e6; /* Rouge pâle pour signaler une erreur */
  color: #d9534f; /* Rouge foncé pour le texte */
  border: 1px solid #d9534f; /* Bordure pour démarquer la zone */
  border-radius: 4px; /* Coins arrondis */
  padding: 10px; /* Espacement interne pour une meilleure lisibilité */
  margin-bottom: 15px; /* Espace sous le message d'erreur */
  font-size: 14px; /* Taille de police pour correspondre au style du formulaire */
}

.error-text {
  margin: 0; /* Supprime les marges par défaut */
  padding: 5px 0; /* Espacement vertical entre chaque erreur */
}

/* Section gauche : Profil */
.profile-section {
  flex: 0 0 30%;
  width: 100%; /* Par défaut, occupe toute la largeur disponible */
  max-width: 300px; /* Limite de largeur sur grands écrans */
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box; /* Inclut le padding dans la largeur totale */
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 15px;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#image-profile:hover {
  cursor: pointer; /* Change le curseur en pointeur lors du survol */
  opacity: 0.8; /* Réduit l'opacité pour un effet de survol */
  transition: opacity 0.3s; /* Ajoute une transition pour un effet plus fluide */
}

.profile-section h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.profile-section p {
  font-size: 16px;
  color: #555;
}

.profile-email {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

@media (max-width: 768px) {
  .profile-section {
    flex: none; /* Annule les règles Flex */
    width: 100%; /* Prend toute la largeur disponible */
    max-width: none; /* Désactive la limite de largeur */
    margin-bottom: 20px; /* Ajoute un espacement sous l'élément */
  }
}

@media (max-width: 370px) {
  .profile-section {
    padding: 10px; /* Réduit légèrement le padding pour les très petits écrans */
    font-size: 14px; /* Réduit la taille globale des polices */
    width: 100%; /* Prend toujours toute la largeur */
    margin: 0 auto 20px auto; /* Garde un centrage visuel */
  }

  .profile-avatar {
    width: 60px;
    height: 60px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-label {
    font-size: 11px;
  }
}

/* Conteneur pour les boutons d'action des tweets */
.tweet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* Boutons Delete et Update */
.tweet-actions .btn {
  padding: 8px 12px;
  font-size: 0.9rem;
  border-radius: 4px;
  text-decoration: none;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Bouton Delete */
.tweet-actions .btn-danger {
  background-color: #dc3545; /* Rouge */
}

.tweet-actions .btn-danger:hover {
  background-color: #a71d2a; /* Rouge foncé au survol */
}

/* Bouton Update */
.tweet-actions .btn-primary {
  background-color: #007bff; /* Bleu */
}

.tweet-actions .btn-primary:hover {
  background-color: #0056b3; /* Bleu foncé au survol */
}

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

On va maintenant écouter les événements sur notre input de recherche. Mais avant on va ajouter un element dans notre html qui va s'afficher lorsque l'on fais une recherche dans la searchbar.

Dans la topbar dans le serach on ajoute une div qui recevra les résultats de notre recherche.
A noter que nous avons déjà prévu un css pour cette div avec notamment la class show qui permettra d'afficher la div ou pas. Pour le moment on va la laisser afficher par défaut. Mais par la suite elle sera afficher quand on fait une recherche uniquement.

<!-- views/includes/topbar.ejs -->

```html
<!-- Search -->
<form class="topbar__search">
  <input
    type="search"
    class="topbar__search-input"
    id="search-input"
    placeholder="Rechercher un utilisateur..."
    aria-label="Rechercher un utilisateur"
  />
  <div id="search-menu-container">
    <div class="search-menu show">
      <div class="search-menu__user">
        <img
          src="/images/avatars/default-avatar.png"
          alt="Avatar utilisateur"
          class="search-menu__avatar"
        />
        <span class="search-menu__username">John Doe</span>
      </div>
    </div>
  </div>
</form>
```

et le css modifié en changeant tous les backgrounds et autres couleurs afin de rendre le site plus sombre.

<!-- public/css/main.css -->

```css
/*==================================
1. RESET ET STYLES DE BASE
==================================*/
/* Reset de base */
body,
h1,
h2,
h3,
p,
ul,
li,
a,
button {
  margin: 0;
  padding: 0;
  list-style: none;
  text-decoration: none;
  color: inherit;
}

body {
  font-family: "Inter", sans-serif;
  line-height: 1.6;
  background-color: #15202b;
  color: #e7e9ea;
}

/*==================================
2. LAYOUT GÉNÉRAL
==================================*/
/* Conteneur global */
.container {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

/*==================================
3. TOPBAR ET NAVIGATION
==================================*/
/* Barre de navigation */
.topbar__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1d1d1d;
  padding: 10px 20px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Composants de la topbar */
.topbar__brand {
  display: flex;
  align-items: center;
}

.topbar__logo {
  width: 40px;
  height: auto;
}

.topbar__right {
  display: flex;
  gap: 30px;
  align-items: center;
}

/* Boutons et liens de la topbar */
.topbar__button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.topbar__button:hover {
  background-color: #0d8bdb;
}

.topbar__link {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  background-color: transparent;
  border-radius: 12px;
  transition: background-color 0.3s, transform 0.2s;
  cursor: pointer;
}

.topbar__link:hover {
  background-color: rgba(255, 255, 255, 0.1); /* Fond gris clair */
  transform: scale(1.05); /* Légère augmentation de taille */
}

.topbar__link:active {
  transform: scale(1); /* Réduit l'effet au clic */
}

/* Barre de recherche */
.topbar__search {
  flex: 0 1 300px;
  margin: 0 20px;
}

.topbar__search-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #2f3336;
  background-color: #202327;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s ease;
  margin: 0;
}

.topbar__search-input::placeholder {
  color: #6e767d;
}

.topbar__search-input:focus {
  background-color: #000;
  border-color: #1da1f2;
  outline: none;
}

/* Menu de recherche */
#search-menu-container {
  position: relative;
  width: 100%;
}

.search-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 5px;
  background-color: #202327;
  border: 1px solid #2f3336;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: none; /* Cache le menu par défaut */
}

.search-menu.show {
  /* Nouvelle classe pour afficher le menu */
  display: block;
}

.search-menu__user {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-menu__user:hover {
  background-color: #2f3336;
}

.search-menu__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid #38444d;
}

.search-menu__username {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

/* Media queries pour topbar */
@media (max-width: 768px) {
  .topbar__nav {
    flex-wrap: wrap;
    gap: 10px; /* Ajoute un espacement entre les éléments */
  }

  .topbar__left {
    flex: 0 0 auto; /* Empêche le logo de rétrécir */
  }

  .topbar__search {
    flex: 1 1 100%; /* Prend toute la largeur disponible */
    order: 3; /* Place la barre de recherche en dessous */
    margin: 10px 0;
  }

  .topbar__right {
    flex: 0 0 auto; /* Empêche les boutons de rétrécir */
    margin-left: auto; /* Pousse les boutons vers la droite */
  }
}

/* Ajoutez ces styles pour les très petits écrans */
@media (max-width: 480px) {
  .topbar__nav {
    padding: 10px;
  }

  .topbar__right {
    gap: 10px; /* Réduit l'espacement entre les boutons */
  }

  .topbar__button {
    padding: 8px 12px; /* Réduit légèrement la taille du bouton */
  }
}

/*==================================
4. SECTION TWEETS
==================================*/
/* Liste des tweets */
.tweet-list {
  flex: 1;
  background-color: #192734;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #38444d;
}

.tweet-list h1 {
  font-size: 24px;
  margin-bottom: 15px;
}

.tweet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.tweet-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #38444d;
}

.tweet-username {
  font-size: 16px;
  font-weight: bold;
  color: #e7e9ea;
}

.tweet-item {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.tweet-item:last-child {
  border-bottom: none;
}

.tweet-item h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.tweet-item p {
  font-size: 16px;
  color: #e7e9ea;
}

/* Actions sur les tweets */
.tweet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

/* Boutons Delete et Update */
.tweet-actions .btn {
  padding: 8px 12px;
  font-size: 0.9rem;
  border-radius: 4px;
  text-decoration: none;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Bouton Delete */
.tweet-actions .btn-danger {
  background-color: #dc3545; /* Rouge */
}

.tweet-actions .btn-danger:hover {
  background-color: #a71d2a; /* Rouge foncé au survol */
}

/* Bouton Update */
.tweet-actions .btn-primary {
  background-color: #007bff; /* Bleu */
}

.tweet-actions .btn-primary:hover {
  background-color: #0056b3; /* Bleu foncé au survol */
}

/*==================================
5. FORMULAIRES
==================================*/
/* Styles généraux des formulaires */
.tweet-form-section {
  max-width: 600px; /* Largeur maximale sur les grands écrans */
  width: 90%; /* Ajuste la largeur pour petits écrans */
  margin: 20px auto; /* Centre le formulaire horizontalement */
  padding: 20px; /* Ajoute des espaces internes */
  background-color: #192734;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box; /* Garantit une largeur cohérente */
  border: 1px solid #38444d;
}

.tweet-form-section h1 {
  margin-bottom: 20px;
  font-size: 24px;
}

form label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

form input[type="text"],
form input[type="email"],
form input[type="password"],
form input[type="search"],
form textarea {
  width: 100%; /* Utilise toute la largeur du conteneur */
  padding: 10px;
  /* margin-bottom: 15px; */
  border: 1px solid #38444d;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box; /* Inclut padding et bordures dans le calcul de la largeur */
  background-color: #15202b !important;
  color: #e7e9ea !important;
}

form input[type="text"]::placeholder,
form input[type="email"]::placeholder,
form input[type="password"]::placeholder,
form input[type="search"]::placeholder,
form textarea::placeholder {
  color: #8899a6;
}

form input[type="text"]:focus,
form input[type="email"]:focus,
form input[type="password"]:focus,
form input[type="search"]:focus,
form textarea:focus {
  border-color: #1da1f2;
}

form button {
  background-color: #1da1f2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

form button:hover {
  background-color: #0d8bdb;
}

/* Media queries pour formulaires */
@media (max-width: 768px) {
  .tweet-form-section {
    width: 95%; /* Utilise presque toute la largeur de l'écran sur tablette */
    padding: 15px; /* Réduit le padding pour conserver de l'espace */
  }

  form input[type="text"],
  form input[type="email"],
  form input[type="password"],
  form input[type="search"],
  form textarea {
    max-width: 100%; /* Les champs s'adaptent à la largeur disponible */
  }
}

@media (max-width: 480px) {
  .tweet-form-section {
    width: 100%; /* Utilise toute la largeur sur mobile */
    padding: 10px; /* Réduit le padding pour les très petits écrans */
  }

  form input[type="text"],
  form input[type="email"],
  form input[type="password"],
  form input[type="search"],
  form textarea {
    width: 100%; /* S'étend sur toute la largeur */
    font-size: 12px; /* Réduit légèrement la taille de la police pour un meilleur rendu */
  }

  form button {
    width: 100%; /* Bouton pleine largeur */
    font-size: 14px;
  }
}

/*==================================
6. PROFIL UTILISATEUR
==================================*/
/* Section profil */
.profile-section {
  flex: 0 0 30%;
  width: 100%; /* Par défaut, occupe toute la largeur disponible */
  max-width: 300px; /* Limite de largeur sur grands écrans */
  background-color: #192734;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  box-sizing: border-box; /* Inclut le padding dans la largeur totale */
  border: 1px solid #38444d;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 15px;
  border: 2px solid #38444d;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

#image-profile:hover {
  cursor: pointer; /* Change le curseur en pointeur lors du survol */
  opacity: 0.8; /* Réduit l'opacité pour un effet de survol */
  transition: opacity 0.3s; /* Ajoute une transition pour un effet plus fluide */
}

.profile-section h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.profile-section p {
  font-size: 16px;
  color: #e7e9ea;
}

.profile-email {
  font-size: 14px;
  color: #8899a6;
  margin-bottom: 15px;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* Media queries pour profil */
@media (max-width: 768px) {
  .profile-section {
    flex: none; /* Annule les règles Flex */
    width: 100%; /* Prend toute la largeur disponible */
    max-width: none; /* Désactive la limite de largeur */
    margin-bottom: 20px; /* Ajoute un espacement sous l'élément */
  }
}

@media (max-width: 370px) {
  .profile-section {
    padding: 10px; /* Réduit légèrement le padding pour les très petits écrans */
    font-size: 14px; /* Réduit la taille globale des polices */
    width: 100%; /* Prend toujours toute la largeur */
    margin: 0 auto 20px auto; /* Garde un centrage visuel */
  }

  .profile-avatar {
    width: 60px;
    height: 60px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-label {
    font-size: 11px;
  }
}

/*==================================
7. INSCRIPTION ET AUTHENTIFICATION
==================================*/
.signup-section {
  max-width: 600px;
  width: 90%;
  margin: 20px auto;
  padding: 20px;
  background-color: #192734;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #38444d;
  color: #e7e9ea;
  text-align: center;
}

.signup-section h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.signup-form {
  width: 100%;
  margin: 0 0;
}

.signup-form label {
  margin-bottom: 5px;
  font-weight: bold;
  box-sizing: border-box;
  display: block;
}

/* Styles communs pour tous les inputs */
.signup-form input {
  width: 100%;
  margin-bottom: 15px;
  border: 1px solid #38444d;
  border-radius: 4px;
  font-size: 14px;
  background-color: #15202b !important;
  color: #e7e9ea !important;
  box-sizing: content-box;
  display: block;
}

.signup-form input::placeholder {
  color: #8899a6;
}

.signup-form #password {
  margin-bottom: 30px;
}

/* Styles pour les boutons */
.signup-form button,
.google-signup {
  width: 100%;
  padding: 12px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  color: white;
  transition: background-color 0.3s;
}

.signup-form button {
  background-color: #1da1f2;
}

.signup-form button:hover {
  background-color: #1a91da;
}

.google-signup {
  background-color: #4285f4;
  margin-top: 10px;
}

.google-signup:hover {
  background-color: #357abd;
}

/* Gestion de l'autofill */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #15202b inset !important;
  -webkit-text-fill-color: #e7e9ea !important;
  transition: background-color 5000s ease-in-out 0s;
}

/*==================================
8. GESTION DES ERREURS
==================================*/
.error-message {
  background-color: rgba(217, 83, 79, 0.1);
  color: #ff6b6b;
  border: 1px solid #d9534f;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 14px;
}

.error-text {
  margin: 0;
  padding: 5px 0;
}

/*==================================
9. UTILITAIRES ET OVERRIDES
==================================*/
/* Styles pour l'autofill */
input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px #15202b inset !important;
  -webkit-text-fill-color: #e7e9ea !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

On va maintenant ajouter notre javascript pour la barre de recherche.

- Quand on clique en dehors de la barre de recherche, on cache le menu de recherche.
- Quand on clique sur la barre de recherche, on affiche le menu de recherche (si au moins 1 résultat) en ajoutant un debounce. On va utiliser setTimeout pour cela.
- Quand on tape, on affiche les résultats de la recherche.
- Quand on clique sur un utilisateur dans la liste des résultats, on va à la page profil de cet utilisateur.

Avant de faire notre javascript on va avoir besoin de plusieurs éléments:

On a besoin de créer une route pour la recherche.

routes/users.routes.js

```javascript
router.get("/", usersSearch);
```

On va transférer la liste des users trouvé affiché dans la topbar dans un partial afin de pouvoir le mettre à jour facilement avec nos controllers.

views/includes/search-results.ejs

```html
<% if (typeof users !== 'undefined' && users && users.length > 0) { %> <%
users.forEach(user => { %>
<div class="search-menu__user">
  <img
    src="<%= user.avatar || '/images/avatars/default-avatar.png' %>"
    alt="Avatar <%= user.username %>"
    class="search-menu__avatar"
  />
  <span class="search-menu__username"><%= user.username %></span>
</div>
<% }); %> <% } %>
```

Et on l'inclus dans notre topbar.

views/includes/topbar.ejs

```html
<!-- Search -->
<form class="topbar__search">
  <input
    type="search"
    class="topbar__search-input"
    id="search-input"
    placeholder="Rechercher un utilisateur..."
    aria-label="Rechercher un utilisateur"
  />
  <div id="search-menu-container">
    <div class="search-menu show">
      <!-- partial search-results.ejs -->
      <%- include("search-results") %>
    </div>
  </div>
</form>
```

On va ajouter notre methode dans le controller users correspondant à la route /users.

controllers/users.controller.js

```javascript
exports.usersSearch = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await searchUsersByUsername(search);
    res.render("includes/search-results", { users });
  } catch (err) {
    next(err);
  }
};
```

On va créer la query pour la recherche.

models/queries/users.queries.js

```javascript
exports.searchUsersByUsername = async (search) => {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // N'accepte que les lettres, chiffres et quelques caractères spéciaux
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(search)) {
    throw new Error("Caractères non autorisés");
  }

  // $regex pour la recherche avec les options i pour ignorer la casse
  // si search="pierre" on va chercher tous les users dont le username contient "pierrre".
  // La fonction trouvera "Pierre", "PIERRE", "pierre", "jean pierre" etc...
  // on ne veut pas récupérer le password, l'email et les id google mais juste le username, l'avatar et l'id
  return await User.find(
    { username: { $regex: escapedSearch, $options: "i" } },
    { username: 1, avatar: 1, _id: 1 }
  );
};
```

Ajout de /public/javascripts/search-bar.js

```javascript
window.addEventListener("DOMContentLoaded", () => {
  const searchMenu = document.querySelector(".search-menu");
  const searchInput = document.getElementById("search-input");

  let ref = null;

  // Quand on tape dans l'input, on lance la recherche au bout de 300ms
  searchInput.addEventListener("input", (e) => {
    // annule le timeout précedent
    if (ref) {
      clearTimeout(ref);
    }

    // démarre un nouveau timeout
    ref = setTimeout(() => {
      // envoi d'une requête à l'API
      fetch(`/users?search=${e.target.value}`)
        .then((res) => res.text())
        .then((html) => {
          // on remplace le contenu de searchMenu par le html reçu
          searchMenu.innerHTML = html;
          // on ajoute la classe show si le contenu de searchMenu n'est pas vide
          if (searchMenu.innerHTML !== "") {
            searchMenu.classList.add("show");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }, 300);
  });

  searchMenu.addEventListener("click", (e) => {
    // pour que le click arrête les actions suivantes
    // sinon le click se propage à la fenêtre et cache le menu
    e.stopPropagation();
  });

  // Quand on clique en dehors de la barre de recherche ou de l'input, on cache le menu de recherche
  window.addEventListener("click", (e) => {
    if (e.target !== searchMenu && e.target !== searchInput) {
      searchMenu.classList.remove("show");
    }
  });

  // On réaffiche le menu si on focus l'input
  searchInput.addEventListener("focus", () => {
    if (searchMenu.innerHTML !== "") {
      searchMenu.classList.add("show");
    }
  });
});
```

On l'impoorte dans notre layout.ejs

views/layout.ejs

```html
<script src="/javascripts/search-bar.js"></script>
```

Maintenant on va modifier notre vue partial search-results.ejs pour ajouter un lien vers la page profil de l'utilisateur.
Quand on clic sur un des profils on va rediriger vers la page profil de l'utilisateur.
/users/:username

views/includes/search-results.ejs

```html
<% if (typeof users !== 'undefined' && users && users.length > 0) { %> <%
users.forEach(user => { %>
<a href="/users/<%= user.username %>">
  <div class="search-menu__user">
    <img
      src="<%= user.avatar || '/images/avatars/default-avatar.png' %>"
      alt="Avatar <%= user.username %>"
      class="search-menu__avatar"
    />
    <span class="search-menu__username"><%= user.username %></span>
  </div>
</a>
<% }); %> <% } %>
```

## Follow User

On ajoute un bouton follow dans la page profil si:

- L'utilisateur n'est pas le même que l'utilisateur connecté
- L'utilisateur n'est pas déjà suivi (currentUser.following.map((id) => id.toString()).includes(user.\_id.toString()))

On va également ajouter des liens pour les boutons suivre et ne plus suivre. On va créer les routes juste après.

- /users/follow/:userId
- /users/unfollow/:userId

views/includes/profile.ejs

```html
<section class="profile">
  <script src="/javascripts/users/profile.js"></script>
  <form
    class="profile-avatar"
    id="profile-avatar-form"
    action="/users/update/avatar"
    method="post"
    enctype="multipart/form-data"
  >
    <input type="file" name="avatar" id="avatar-input" hidden />
    <img
      src="<%= user.avatar || '/images/avatars/default-avatar.png' %>"
      alt="Avatar de username"
      id="image-profile"
    />
  </form>
  <h2><%= user.username %></h2>
  <p class="profile-email"><%= user.email %></p>
  <div class="profile-stats">
    <div class="stat-item">
      <span class="stat-value"><%= tweets.length %></span>
      <span class="stat-label">Tweets</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">120</span>
      <span class="stat-label">Abonnements</span>
    </div>
  </div>
  <% if (currentUser._id.toString() !== user._id.toString()) { %> <% if
  (!currentUser.following.map((id) =>
  id.toString()).includes(user._id.toString())) { %>
  <a href="/users/follow/<%= user._id %>">
    <button class="topbar__button profile__follow-btn">Suivre</button>
  </a>
  <% } else { %>
  <a href="/users/unfollow/<%= user._id %>">
    <button class="topbar__button profile__unfollow-btn">Ne plus suivre</button>
  </a>
  <% } %> <% } %>
</section>
```

Et ajouter le css suivant dans main.css section 6 PROFIL UTILISATEUR

```css
/* Dans la section 6. PROFIL UTILISATEUR */
.profile__follow-btn,
.profile__unfollow-btn {
  display: block;
  margin: 15px auto;
  width: 80%;
  max-width: 200px;
}

.profile__unfollow-btn {
  background-color: #dc3545 !important; /* Rouge pour le bouton "Ne plus suivre" */
}

.profile__unfollow-btn:hover {
  background-color: #a71d2a !important;
}
```

On va maintenant créer nos routes /users/follow/:id et /users/unfollow/:id.

routes/users.routes.js

```javascript
const router = require("express").Router();
const { ensureAuthenticated } = require("../config/guards.config");
const {
  signupForm,
  signup,
  updateAvatar,
  userProfile,
  usersSearch,
  followUser,
  unfollowUser,
} = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);
router.post("/update/avatar", ensureAuthenticated, updateAvatar);
router.get("/follow/:userId", ensureAuthenticated, followUser);
router.get("/unfollow/:userId", ensureAuthenticated, unfollowUser);
router.get("/:username", userProfile);
router.get("/", usersSearch);

module.exports = router;
```

On va maintenant créer les méthodes dans le controller users.controller.js

controllers/users.controller.js

```javascript
exports.followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // ces deux requêttes peuvent être faite en parallèle
    // on utilise Promise.all pour les faire en parallèle
    // on utilise le destructuring pour récupérer les résultats des deux promesses
    // on ne veut pas récupérer le résultat de addUserIdToCurrentUserFollowing
    // donc on laisse vide le premier élément du tableau
    const [, user] = await Promise.all([
      addUserIdToCurrentUserFollowing(userId, currentUser._id),
      findUserById(userId),
    ]);

    res.redirect(`/users/${user.username}`);
  } catch (err) {
    next(err);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const [, user] = await Promise.all([
      removeUserIdFromCurrentUserFollowing(userId, currentUser._id),
      findUserById(userId),
    ]);
    res.redirect(`/users/${user.username}`);
  } catch (err) {
    next(err);
  }
};
```

On va avoir besoin d'ajouter des queries dans le models/queries/users.queries.js

models/queries/users.queries.js

```javascript
exports.addUserIdToCurrentUserFollowing = async (userId, currentUserId) => {
  return await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { following: userId },
  });
  // on aurait aussi pu faire:
  // currentUser.following.push(userId);
  // return await currentUser.save();
};

exports.removeUserIdFromCurrentUserFollowing = async (
  userId,
  currentUserId
) => {
  return await User.findByIdAndUpdate(currentUserId, {
    $pull: { following: userId },
  });
  // on aurait aussi pu faire:
  // currentUser.following = currentUser.following.filter(
  //   (id) => id.toString() !== userId
  // );
  // return await currentUser.save();
};
```

Il faut mettre à jour l'affiche du nombre d'abonnements dans la view partial profile.ejs
On en profite également pour corriger le nombre de tweets qui comptait le total des tweets affichés y compris ceux n'appartenant pas à l'utilisateur connecté.

views/includes/profile.ejs

```html
<section class="profile">
  <script src="/javascripts/users/profile.js"></script>
  <form
    class="profile-avatar"
    id="profile-avatar-form"
    action="/users/update/avatar"
    method="post"
    enctype="multipart/form-data"
  >
    <input type="file" name="avatar" id="avatar-input" hidden />
    <img
      src="<%= user.avatar || '/images/avatars/default-avatar.png' %>"
      alt="Avatar de username"
      id="image-profile"
    />
  </form>
  <h2><%= user.username %></h2>
  <p class="profile-email"><%= user.email %></p>
  <div class="profile-stats">
    <div class="stat-item">
      <span class="stat-value"
        ><%= tweets.filter(tweet => tweet.author._id.toString() ===
        user._id.toString()).length %></span
      >
      <span class="stat-label">Tweets</span>
    </div>
    <div class="stat-item">
      <span class="stat-value"><%= user.following.length || "-" %></span>
      <span class="stat-label">Abonnements</span>
    </div>
  </div>
  <% if (currentUser._id.toString() !== user._id.toString()) { %> <% if
  (!currentUser.following.map((id) =>
  id.toString()).includes(user._id.toString())) { %>
  <a href="/users/follow/<%= user._id %>">
    <button class="topbar__button profile__follow-btn">Suivre</button>
  </a>
  <% } else { %>
  <a href="/users/unfollow/<%= user._id %>">
    <button class="topbar__button profile__unfollow-btn">Ne plus suivre</button>
  </a>
  <% } %> <% } %>
</section>
```

On va également ajouter un lien vers le profil des utilisateurs qui apparaissent dans la liste de nos tweets.

/tweets/partials/tweet-list.ejs

```html
<main class="tweet-list" id="tweet-list-container">
  <h1>Derniers posts</h1>
  <% if (tweets && tweets.length > 0) { %>
  <ul>
    <% tweets.forEach(function (tweet) { %>
    <li class="tweet-item">
      <% if (currentUser._id.toString() !== tweet.author._id.toString()) { %>
        <a href="/users/<%= tweet.author.username %>">
      <% } else { %>
        <div>
      <% } %>
        <div class="tweet-header">
          <img
            src="<%= tweet.author.avatar || '/images/avatars/default-avatar.png' %>"
            alt="Avatar"
            class="tweet-avatar"
          />
          <span class="tweet-username"><%= tweet.author.username %></span>
        </div>
      <% if (currentUser._id.toString() !== tweet.author._id.toString()) { %>
        </a>
      <% } else { %>
        </div>
      <% } %>
      <p><%= tweet.content %></p>
      <% if (editable && tweet.author._id.toString() ===
      currentUser._id.toString()) { %>
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
          onclick="window.location.href='/tweets/edit/<%= tweet._id %>'"
        >
          Update
        </button>
      </div>
      <% } %>
    </li>
    <% }); %>
  </ul>
  <% } else { %>
  <p>Aucun tweet trouvé</p>
  <% } %>
</main>
```

Normalement tout est ok. Les posts de cet utilisateurs sont biens affichés dans nos tweets.
