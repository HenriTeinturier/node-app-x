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
