const app = require("../app");
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
