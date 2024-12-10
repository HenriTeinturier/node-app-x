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
  emailLinkVerification,
} = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);
router.post("/update/avatar", ensureAuthenticated, updateAvatar);
router.get("/follow/:userId", ensureAuthenticated, followUser);
router.get("/unfollow/:userId", ensureAuthenticated, unfollowUser);
router.get("/verify", emailLinkVerification);
router.get("/:username", userProfile);
router.get("/", usersSearch);

module.exports = router;
