const passport = require("passport");
const emailService = require("../emails");

exports.signinForm = (req, res, next) => {
  res.render("layout", {
    content: "auth/auth-form",
    errors: null,
    isAuthenticated: req.isAuthenticated(),
    currentUser: req.user,
  });
};

exports.signin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err); // Arrête l'exécution ici
    }

    if (!user) {
      return res.render("layout", {
        content: "auth/auth-form",
        errors: [info.message],
        isAuthenticated: req.isAuthenticated(),
        currentUser: req.user,
      }); // Arrête l'exécution ici
    }

    return req.login(user, (err) => {
      if (err) {
        return next(err); // Arrête l'exécution ici
      }
      return res.redirect("/tweets"); // Arrête l'exécution ici
    });
  })(req, res, next);
};

exports.signout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/auth/signin/form");
  });
};

exports.signinWithGoogle = (req, res, next) => {
  passport.authenticate("google", { scope: ["email", "profile"] })(
    req,
    res,
    next
  );
};

// exports.signinWithGoogleCallback = (req, res, next) => {
//   passport.authenticate("google", {
//     successRedirect: "/tweets",
//     failureRedirect: "/auth/signin/form",
//   })(req, res, next);
// };

exports.signinWithGoogleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.redirect("/auth/signin/form");
    }

    if (!user.emailVerified) {
      emailService.sendEmailVerification({
        to: user.email,
        username: user.username,
        token: user.emailToken,
        userId: user._id,
        host: req.headers.host,
      });
    }

    return req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/tweets");
    });
  })(req, res, next);
};
