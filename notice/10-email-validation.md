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

```ejs
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
MAILTRAP_API_KEY=""
MAILTRAP_USER=""
```

Et mise à disposition dans les fichiers environment/development.js et environment/production.js

```js
 sparkPostApiKey: process.env.SPARKPOST_API_KEY,
  sparkPostDomain: process.env.SPARKPOST_DOMAIN,
  mailtrapApiKey: process.env.MAILTRAP_API_KEY,
  mailtrapUser: process.env.MAILTRAP_USER,
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
      this.transporter = nodemailerSparkpostTransport({
        sparkPostApiKey: process.env.SPARKPOST_API_KEY,
        endpoint: "https://api.eu.sparkpost.com",
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: config.mailtrapUser,
          pass: config.mailtrapApiKey,
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
        url: `https://${options.host}/auth/verify?userId=${options.userId}&token=${options.token}`,
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

```ejs

```
