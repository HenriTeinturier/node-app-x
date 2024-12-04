# Création architecture globale

```bash
npm init
npm i express morgan ejs
// pour les utilisateurs de windows nous allons ajouter dotenv pour pouvoir utiliser les variables d'environnement
npm i dotenv
```

### Étapes de création

1. **Création des fichiers principaux :**

   - [ ] `app.js`
   - [ ] Dossiers :
     - `routes`
     - `views`
     - `public`
   - [ ] Sous-dossiers dans `public` :
     - `javascripts`
     - `css`
     - `images`

2. **Ajout du script pour démarrer l'application en local :**
   Ajoutez ce script dans le fichier `package.json` :

```bash
"dev": "node --watch-path=./ app.js"
```

3. **Lancer l'application :**
   Utilisez la commande suivante pour démarrer le serveur en mode développement :

```bash
npm run dev
```

## `.gitignore`

Voici le contenu recommandé pour le fichier `.gitignore` :

```bash
**/node_modules
*.env
```

## Configuration initiale de l'application

### `app.js`

Le fichier `app.js` configure les routes, les middlewares, et les fichiers statiques. Il est le point d'entrée de votre application.

```javascript
// pour les utilisateurs de windows nous allons charger les variables d'environnement au début du fichier
require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
// Définir le port via une variable d'environnement ou utiliser 3000 par défaut
// sur linux/macos il est possible de créer un fichier .env dans le dossier root avec PORT=3000.
// il serait aussi possible de l'injecter directement dans le script de démmarrage de node avec PORT=3000 node --watch-path=./ app.js
// sur windows cela necessite d'installer un library comme dotenv
const port = process.env.PORT || 3000;
const index = require("./routes/index");
const morgan = require("morgan");

// Configuration du moteur de template (EJS)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Serveur des fichiers statiques (comme CSS, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Middlewares globaux
app.use(morgan("short")); // Middleware pour les logs HTTP
app.use(express.json()); // Parse le JSON dans le corps des requêtes
app.use(express.urlencoded({ extended: true })); // Parse les données de formulaires

// Définition des routes déléguées dans le fichier index.js
app.use(index);

// Lancer le serveur sur le port spécifié
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
```

## Création des routes

### `routes/index.js`

Définition de la route principale (`/`) pour afficher la vue `layout` avec le contenu `home` :  
Nous passons `home` en variable `content` à la vue `layout`. Par la suite nous pourrons passer d'autres variables personnalisées.

```javascript
const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("layout", { content: "home" });
});

module.exports = router;
```

## Création des vues

### `views/layout.ejs`

Fichier contenant la structure globale HTML et le template des pages :
On va mettre toute l'ossature de nos pages html dans ce fichier. On va y inclure le topbar et le contenu de la page qui est passé en variable (content).
On importe le css main.css dans le head.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="/css/main.css" />
    <title>X Clone</title>
  </head>
  <body>
    <header class="topbar"><%- include("includes/topbar") %></header>
    <main class="main-content"><%- include(content) %></main>
  </body>
</html>
```

### `views/home.ejs`

Contenu spécifique de la page d'accueil :

```html
<section class="home-section">
  <h1 class="home-title">Welcome to X Clone</h1>
  <p class="home-description">Stay connected with the world.</p>
</section>
```

### `views/includes/topbar.ejs`

Topbar contenant le logo et les liens de navigation :  
Le logo est un lien vers la page d'accueil.
A droite on va mettre un bouton pour poster un tweet. ainsi qu'un lien pour se connecter.
Il faut ajouter le logo dans le dossier public/images. Choisissez une image png avec fond transparent du logo X et nommez le X_logo.png.

```html
<nav class="topbar__nav">
  <div class="topbar__left">
    <a href="/" class="topbar__brand">
      <img src="/images/X_logo.png" alt="Logo" class="topbar__logo" />
    </a>
  </div>
  <div class="topbar__right">
    <button class="topbar__button">Poster</button>
    <ul class="topbar__menu">
      <li class="topbar__item">
        <a href="#" class="topbar__link">Connexion</a>
      </li>
    </ul>
  </div>
</nav>
```

## Ajout d'un fichier CSS custom

### `public/css/main.css`

Le fichier CSS `main.css` est placé dans `public/css` et est appelé dans `layout.ejs`.

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
```
