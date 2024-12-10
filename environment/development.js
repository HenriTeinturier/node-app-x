const path = require("path");

module.exports = {
  nodeEnv: "development",
  dbUrl: process.env.ATLAS_URI,
  cert: process.env.CERT_PATH,
  key: process.env.KEY_PATH,
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
  sparkPostApiKey: process.env.SPARKPOST_API_KEY,
  sparkPostDomain: process.env.SPARKPOST_DOMAIN,
  mailtrapApiKey: process.env.MAILTRAP_API_KEY,
  mailtrapUser: process.env.MAILTRAP_USER,
};
