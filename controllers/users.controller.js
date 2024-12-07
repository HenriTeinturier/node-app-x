const {
  createUser,
  getUserByUsername,
  searchUsersByUsername,
  addUserIdToCurrentUserFollowing,
  findUserById,
  removeUserIdFromCurrentUserFollowing,
} = require("../queries/users.queries");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { getTweetsFromUsername } = require("../queries/tweets.queries");
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../public/images/avatars"));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

exports.signupForm = (req, res, next) => {
  res.render("layout", {
    content: "users/user-form",
    errors: null,
    isAuthenticated: req.isAuthenticated(),
    currentUser: req.user,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const body = req.body;
    const user = await createUser(body);
    console.log(user);
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (error) {
    res.render("layout", {
      content: "users/user-form",
      errors: [error.message],
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  }
};

exports.updateAvatar = [
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const user = req.user;

      // Ne pas supprimer l'avatar par défaut
      if (user.avatar && !user.avatar.includes("default-avatar.png")) {
        const oldAvatarPath = path.join(__dirname, "../public", user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      user.avatar = `/images/avatars/${req.file.filename}`;
      await user.save();
      res.redirect("/");
    } catch (error) {
      next(error);
    }
  },
];

exports.userProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    const tweets = await getTweetsFromUsername(username);
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
      user: user,
      editable: false,
    });
  } catch (err) {
    next(err);
  }
};

exports.usersSearch = async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await searchUsersByUsername(search);
    res.render("includes/search-results", { users });
  } catch (err) {
    next(err);
  }
};

exports.followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // ces deux requêttes peuvent être faite en parallèle
    // on utilise Promise.all pour les faire en parallèle
    // on utilise le destructuring pour récupérer les résultats des deux promesses
    // on ne veut pas récupérer le résultat de addUserIdToCurrentUserFollowing
    // donc on laisse vide le premier élément du tableau
    const [, user] = await Promise.all([
      addUserIdToCurrentUserFollowing(userId, currentUser._id),
      findUserById(userId),
    ]);

    res.redirect(`/users/${user.username}`);
  } catch (err) {
    next(err);
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const [, user] = await Promise.all([
      removeUserIdFromCurrentUserFollowing(userId, currentUser._id),
      findUserById(userId),
    ]);
    res.redirect(`/users/${user.username}`);
  } catch (err) {
    next(err);
  }
};
