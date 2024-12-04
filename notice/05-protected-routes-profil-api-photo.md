# protection des routes tweets / profil / API de téléchargement de la photo de profil

## Routes protégées

On va créer un guard (middleware) pour vérifier que les routes profil ne sont accessibles que pour le user en question...

On crée un fichier guards.config.js dans le dossier config et on l'importe dans les routes protégées.

Si un utilisateur veut accéder à une route protégée, il faut qu'il soit authentifié sinon il sera redirigé vers la page de login.

config/guard.config.js

```js
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/auth/signin/form");
  }
};
```

routes/index.js

```js
const router = require("express").Router();
const tweetsRouter = require("./tweets.routes");
const usersRouter = require("./users.routes");
const authRouter = require("./auth.routes");
const { ensureAuthenticated } = require("../config/guards.config");

router.use("/tweets", ensureAuthenticated, tweetsRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.get("/", (req, res) => {
  res.redirect("/tweets");
});

module.exports = router;
```

## Création de la partie profil

On ajoute sur le schema user le fait que le username soit unique.

Mis à jour du css pour la partie profil.

public/css/main.css

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

Mise à jour de la view static pour le profil.

views/includes/profile.ejs

```ejs
<section class="profile">
  <div class="profile-avatar">
    <img src="/images/default-avatar.png" alt="Avatar de username" />
  </div>
  <h2><%= currentUser.username %></h2>
  <p class="profile-email"><%= currentUser.email %></p>
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

J'ai ajouté une photo de profil par défaut dans public/images/default-avatar.png

## Création du formulaire pour upload photo de profil

Quand je clic sur l'avatar, je veux pouvoir upload une photo de profil.
On va utiliser un formulaire avec un input de type file. Mais cet input sera caché.
Quand on clic sur l'image il y aura un eventListener qui va trigger l'input de type file et va permettre de upload une photo.
On va également écouter un autre événement: Le changement de valeur de l'input file. Et dans ce cas on soumettra notre formulaire depuis notre js à notre backend.
Puis on va redirect pour reload la page.
On importe directement le script qui n'est pas encore crée.
Et on ajoute la method, l'action et enctype au formaulaire. Idem on va créer cette action par la suite.

### Création du formulaire

views/includes/profile-form.ejs

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
      src="/images/default-avatar.png"
      alt="Avatar de username"
      id="image-profile"
    />
  </form>
  <h2><%= currentUser.username %></h2>
  <p class="profile-email"><%= currentUser.email %></p>
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

### Création du javascript pour le formulaire

public/javascripts/users/profile.js

> rappel: C'est du javascript client.

- on écoute les clics sur l'image et on provoque le click sur l'input file
- on écoute les changements de valeur de l'input file et on soumet le formulaire

```js
window.addEventListener("DOMContentLoaded", () => {
  const imageProfile = document.getElementById("image-profile");
  const inputAvatar = document.getElementById("avatar-input");
  const form = document.getElementById("profile-avatar-form");

  imageProfile.addEventListener("click", () => {
    inputAvatar.click();
  });

  inputAvatar.addEventListener("change", () => {
    form.submit();
  });
});
```

## API pour upload photo de profil

On créer notre route pour upload photo de profil dans routes/users.routes.js. Cette route est protégée par notre guard.

```js
const router = require("express").Router();
const { ensureAuthenticated } = require("../config/guards.config");
const {
  signupForm,
  signup,
  updateAvatar,
} = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);
router.post("/update/avatar", ensureAuthenticated, updateAvatar);

module.exports = router;
```

On créer notre methode dans controllers/users.controller.js

```js
exports.updateAvatar = (req, res) => {
  console.log(req.file);
};
```

On va aller adapter notre model user pour ajouter un avatar de type string avec une valeur par défaut sur notre image que l'on a mis dans public/images/default-avatar.png

database/models/user.model.js

```js
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: { type: String, default: "/images/default-avatar.png" },
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

### Configuration de multer pour upload photo de profil

On installe multer

```bash
npm install multer
```

> rappel: Rappel : Dans Express, une route peut accepter plusieurs middlewares qui seront exécutés les uns après les autres avant de traiter la requête dans un route handler.  
> Voici un exemple typique:  
> router.post("/update/avatar", upload.single("avatar"), updateAvatar);

Nous allons configurer notre middleware multer et l'insérer dans notre array de middlewares dans la methode updateAvatar. Cette methode reçevra un tableau avec un middleware (multer) et un route handler (updateAvatar).

> Note : Bien que les route handlers et les middlewares soient tous des fonctions dans Express, un route handler se distingue car il termine généralement le cycle de vie de la requête en renvoyant une réponse.

controllers/users.controller.js

On créer un folder public/images/avatars/
On déplace notre image default-avatar.png dans ce dossier.
On remodifie notre schema user pour que l'avatar soit par défaut /images/avatars/default-avatar.png
on modifie notre view includes/profiles.ejs pour que l'avatar soit par défaut /images/avatars/default-avatar.png

```js
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../public/images/avatars"));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

exports.updateAvatar = [
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const user = req.user;
      user.avatar = `/images/avatars/${req.file.filename}`;
      await user.save();
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },
];
```

On va rendre l'image dynamique dans notre view includes/profile.ejs

views/includes/profile.ejs

```html
<img
  src="<%= currentUser.avatar || '/images/avatars/default-avatar.png' %>"
  alt="Avatar de username"
  id="image-profile"
/>
```

On va supprimer les images dans le dossier images/avatars quand on change d'avatar sinon on va se retrouver avec des tonnes d'images stockées inutiles.

controllers/users.controller.js

```js
exports.updateAvatar = [
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const user = req.user;

      // Ne pas supprimer l'avatar par défaut
      if (user.avatar && !user.avatar.includes("default-avatar.png")) {
        const oldAvatarPath = path.join(__dirname, "../public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      user.avatar = `/images/avatars/${req.file.filename}`;
      await user.save();
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },
];
```
