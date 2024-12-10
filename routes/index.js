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

// test du template de l'email de validation
// const ejs = require("ejs");
// const path = require("path"); // Ajoutez cette ligne pour gérer les chemins

// router.get("/test-email", (req, res) => {
//   ejs.renderFile(
//     path.join(__dirname, "../emails/templates/email-verification.ejs"),
//     {
//       username: "John Doe",
//       verificationUrl:
//         "https://localhost:3000/auth/verify?userId=123&token=456",
//     },
//     (err, html) => {
//       if (err) {
//         console.error("Erreur de rendu:", err);
//         return res.status(500).send("Erreur lors du rendu du template");
//       }
//       res.send(html);
//     }
//   );
// });

module.exports = router;
