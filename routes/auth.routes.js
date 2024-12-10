const router = require("express").Router();
const {
  signinForm,
  signin,
  signout,
  signinWithGoogle,
  signinWithGoogleCallback,
} = require("../controllers/auth.controller");

router.get("/signin/form", signinForm);
router.post("/signin", signin);
router.get("/signout", signout);
router.get("/google", signinWithGoogle);
router.get("/google/callback", signinWithGoogleCallback);

module.exports = router;
