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
