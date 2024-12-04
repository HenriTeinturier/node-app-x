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
