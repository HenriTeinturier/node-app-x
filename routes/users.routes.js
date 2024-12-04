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
