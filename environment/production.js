const path = require("path");

module.exports = {
  dbUrl: process.env.ATLAS_URI,
  cert: process.env.CERT_PATH,
  key: process.env.KEY_PATH,
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
};
