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
