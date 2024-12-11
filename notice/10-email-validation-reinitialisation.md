# 10-email-validation.md

## Adapatation du Model

Nous allons ajouter deux champs dans le model user :

- emailToken : un token qui sera envoyé à l'utilisateur par email pour la validation de son email
- emailVerified : un boolean qui indique si l'email est validé

/database/models/user.model.js

```js
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  emailToken: { type: String },
  emailVerified: { type: Boolean, default: false },
  avatar: { type: String, default: "/images/avatars/default-avatar.png" },
  following: { type: [Schema.Types.ObjectId], ref: "user", default: [] },
  local: {
    password: { type: String },
  },
  google: {
    id: {
      type: String,
    },
  },
});
```

## Affichage du statut de vérification de l'email

/views/includes/profile.ejs

On ajoute un affichage du statut de vérification de l'email dans le profil de l'utilisateur.

/views/includes/profile.ejs

```html
<!-- Affichage du statut de vérification de l'email -->
<% if (currentUser._id.toString() === user._id.toString()) { %>
<div class="profile-verification-status">
  <% if (currentUser.emailVerified) { %>
  <span class="verification-badge verified">✓ Email vérifié</span>
  <% } else { %>
  <span class="verification-badge unverified">⚠ Email non vérifié</span>
  <% } %>
</div>
<% } %>
```

Et on ajoute ce css dans le fichier main.css dans la partie 6 PROFILE UTILISATEUR

main.css

```css
.profile-verification-status {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #38444d;
  text-align: center;
}

.verification-badge {
  display: inline-block;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
}

.verification-badge.verified {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  border: 1px solid #28a745;
}

.verification-badge.unverified {
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  border: 1px solid #ffc107;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
```

## Création des emails de vérification

### Mise en place de nodemailer

on install nodemailer, nodemailer-sparkpost-transport

```bash
npm install nodemailer nodemailer-sparkpost-transport
```

on ajoute les variables d'environnement dans le fichier .env.dev et .env.prod

```bash
SPARKPOST_API_KEY=""
SPARKPOST_DOMAIN=""
MAILTRAP_USER=""
MAILTRAP_PASSWORD=""
```

Et mise à disposition dans les fichiers environment/development.js et environment/production.js

```js
 sparkPostApiKey: process.env.SPARKPOST_API_KEY,
  sparkPostDomain: process.env.SPARKPOST_DOMAIN,
  mailtrapUser: process.env.MAILTRAP_USER,
  mailtrapPassword: process.env.MAILTRAP_PASSWORD,
```

Création du fichier emails/index.js

On va mettre dedans la logique de l'envoi d'email.
On va créer une fonction par type de template. Pour le moment que celle pour l'envoi d'un email de vérification.
J'ai ajouté des fonctions génériques pour l'envoi d'email et la compilation des templates EJS.
Cela permettra de réutiliser les mêmes fonctions pour les autres types d'email.

```js
const nodemailer = require("nodemailer");
const nodemailerSparkpostTransport = require("nodemailer-sparkpost-transport");
const config = require("../environment/config");
const path = require("path");
const ejs = require("ejs");
const fs = require("fs");

class Email {
  constructor() {
    this.from = `X-clone <no-reply@${config.sparkPostDomain}>`;
    if (config.nodeEnv === "production") {
      this.transporter = nodemailer.createTransport(
        nodemailerSparkpostTransport({
          sparkPostApiKey: config.sparkPostApiKey,
          endpoint: "https://api.eu.sparkpost.com",
        })
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: config.mailtrapUser,
          pass: config.mailtrapPassword,
        },
      });
    }
  }

  // compilation du template EJS
  async compileTemplate(templateName, templateData) {
    const template = fs.readFileSync(
      path.join(__dirname, `templates/${templateName}.ejs`),
      "utf-8"
    );
    return await ejs.render(template, templateData);
  }

  // Gère l'envoi demail générique avec toutes les options nécéssaires.
  async sendEmail(options) {
    try {
      const htmlContent = await this.compileTemplate(
        options.template,
        options.templateData
      );

      const emailOptions = {
        from: this.from,
        subject: options.subject,
        to: options.to,
        html: htmlContent,
      };

      const emailResult = await this.transporter.sendMail(emailOptions);
      console.log("Message sent: %s", emailResult.messageId);
      return emailResult;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Envoi d'un email de vérification
  async sendEmailVerification(options) {
    return this.sendEmail({
      subject: "X-clone - Vérification de votre email",
      to: options.to,
      template: "email-verification",
      templateData: {
        username: options.username,
        url: `https://${options.host}/users/verify?userId=${options.userId}&token=${options.token}`,
      },
    });
  }

  // async sendPasswordReset(options) {
  //   return this.sendEmail({
  //     template: 'password-reset',
  //     templateData: options.templateData,
  //     to: options.to,
  //     subject: "X-clone - Réinitialisation de mot de passe"
  //   });
  // }
}

module.exports = new Email();
```

### templates

On va créer un template pour l'email de vérification.

/emails/templates/email-verification.ejs

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Vérifiez votre compte X-Clone</title>
  </head>
  <body
    style="
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    "
  >
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="color: #1da1f2">X-Clone</h1>
    </div>

    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px">
      <h2 style="color: #14171a">Bonjour <%= username %>,</h2>

      <p style="color: #657786">
        Merci d'avoir créé un compte sur X-Clone. Pour commencer à utiliser
        votre compte, veuillez vérifier votre adresse email en cliquant sur le
        bouton ci-dessous.
      </p>

      <div style="text-align: center; margin: 30px 0">
        <a
          href="<%= url %>"
          target="_blank"
          style="
            background-color: #1da1f2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
          "
        >
          Vérifier mon compte
        </a>
      </div>

      <p style="color: #657786; font-size: 14px">
        Si vous n'avez pas créé de compte sur X-Clone, vous pouvez ignorer cet
        email.
      </p>
    </div>

    <div
      style="
        text-align: center;
        margin-top: 20px;
        color: #657786;
        font-size: 12px;
      "
    >
      <p>© <%= new Date().getFullYear() %> X-Clone. Tous droits réservés.</p>
    </div>
  </body>
</html>
```

## Route pour la reception de l'email de vérification

/routes/users.routes.js

On ajoute une route pour la reception de l'email de vérification.

```js
router.get("/verify", emailLinkVerification);
```

## Controller Pour la reception de l'email de vérification

/controllers/users.controller.js

On vérifie que l'utilisateur existe, que son email n'est pas déjà vérifié, que le token est valide et on valide l'email.
Pour le moment on le redirige vers la page d'accueil.

```js
exports.emailLinkVerification = async (req, res, next) => {
  try {
    const { userId, token } = req.query;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.emailVerified) {
      return res.status(400).send("Email already verified");
    }
    if (user.emailToken !== token) {
      return res.status(400).send("Invalid token");
    }
    user.emailVerified = true;
    user.emailToken = null;
    await user.save();
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};
```

Optionnel: on aurait pu connecter l'utilisateur après la vérification de son email.

```js
exports.emailLinkVerification = async (req, res, next) => {
  try {
    const { userId, token } = req.query;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    if (user.emailVerified) {
      return res.status(400).send("Email already verified");
    }
    if (user.emailVerificationToken !== token) {
      return res.status(400).send("Invalid token");
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    // Connecter l'utilisateur automatiquement
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (err) {
    next(err);
  }
};
```

## Envoi de l'email de vérification

### Controller de la vérification de l'email

On va envoyer l'email de vérification dans le controller de l'inscription.

/controllers/users.controller.js

Dans la méthode signup, on va ajouter l'envoi de l'email de vérification.
On va également ensuite devoir ajouter la logique de création automatique d'un token dans la query createUser.

- on récupère le constructeur d'email que l'on nomme emailService
- on envoie l'email de vérification avec le token et l'id du user et les autres informations nécéssaires.

```js
const emailService = require("../emails");

exports.signup = async (req, res, next) => {
  try {
    const body = req.body;
    const user = await createUser(body);
    emailService.sendEmailVerification({
      to: user.email,
      username: user.username,
      token: user.emailToken,
      userId: user._id,
      host: req.headers.host,
    });
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
```

### Token dans la query createUser

On doit modifier la query createUser pour ajouter le token de vérification dans la query.
On va utiliser le package uuid pour générer un token de vérification.

```bash
npm install uuid
```

/queries/users.queries.js

```js
const { v4: uuidv4 } = require("uuid");

exports.createUser = async (user) => {
  try {
    const hashedPassword = await User.hashPassword(user.password);

    const newUser = new User({
      username: user.username,
      email: user.email,
      emailToken: uuidv4(),
      local: {
        password: hashedPassword,
      },
    });
    return newUser.save();
  } catch (error) {
    throw error;
  }
};
```

## Mise à jour pour l'inscription avec Google

### Mise à jour de la strategy passport Google

On va modifier la configuration de passport google.
On ajoute le token de vérification et le champ emailVerified à false avant de save le user dans la bdd.

/config/passport.config.js

```js
const { v4: uuidv4 } = require("uuid");

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
          emailToken: uuidv4(),
          emailVerified: false,
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
```

### Mise à jour du controller de l'inscription avec Google

/controllers/auth.controller.js

On va ajouter l'envoi de l'email de vérification dans le controller de l'inscription avec Google si l'utilisateur n'a pas encore vérifié son email.

```js
const emailService = require("../emails");

exports.signinWithGoogleCallback = (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (err) {
      return next(err);
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
```
