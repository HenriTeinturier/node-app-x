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
  initResetPassword,
  resetPasswordForm,
  resetPassword,
} = require("../controllers/users.controller");

router.get("/signup/form", signupForm);
router.post("/signup", signup);
router.post("/update/avatar", ensureAuthenticated, updateAvatar);
router.get("/follow/:userId", ensureAuthenticated, followUser);
router.get("/unfollow/:userId", ensureAuthenticated, unfollowUser);
router.get("/verify", emailLinkVerification);
router.post("/forgot-password", initResetPassword);
router.get("/reset-password", resetPasswordForm);
router.post("/reset-password", resetPassword);
router.get("/:username", userProfile);
router.get("/", usersSearch);

module.exports = router;
