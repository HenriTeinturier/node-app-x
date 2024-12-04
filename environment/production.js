const path = require("path");

module.exports = {
  dbUrl: process.env.ATLAS_URI,
  cert: path.join(__dirname, ""),
  key: path.join(__dirname, ""),
  httpPort: process.env.HTTP_PORT,
  httpsPort: process.env.HTTPS_PORT,
};
