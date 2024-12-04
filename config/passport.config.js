const app = require("../app");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { findUserByEmail, findUserById } = require("../queries/users.queries");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../database/models/user.model");

app.use(passport.initialize()); // initialisation obligatoire

app.use(passport.session()); // utilisation des sessions avec passport

// Après l'authentification nous ne stockons que l'_id du user
// dans la session pour ne pas la surcharger
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// A chaque requête, la session est récupérée par express-session en utilisant
// l'id de la session dans le cookie. Passport récupère l'_id du user dans la session
// et exécute cette méthode. Nous récupérons le user avec son _id et le retournons
// à Passport avec done(null, user). Passport le mettra alors sur req.user
passport.deserializeUser(async (_id, done) => {
  try {
    const user = await findUserById(_id);

    if (!user) {
      return done(null, false, {
        message: "Utilisateur non trouvé dans la session",
      });
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Configuration de la stratégie locale
// Nous utilisons l'email comme identifiant et devons donc passer
// l'option usernameField
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Utilisateur non trouvé" });
        }

        const match = await user.comparePassword(password);

        if (!match) {
          return done(null, false, { message: "Mot de passe incorrect" });
        }

        return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const user = await findUserByEmail(email);

        if (user) {
          return done(null, user);
        }

        const newUser = new User({
          username: profile.displayName,
          email: email,
          google: {
            id: profile.id,
          },
        });

        const savedUser = await newUser.save();
        return done(null, savedUser);
      } catch (error) {
        return done(error);
      }
    }
  )
);
