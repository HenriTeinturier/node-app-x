module.exports = {
  apps: [
    {
      name: "X-Clone",
      script: "./bin/www",
      env: {
        NODE_ENV: "production",
        ATLAS_URI: "",
        GOOGLE_CLIENT_ID: "",
        GOOGLE_CLIENT_SECRET: "",
        SESSION_SECRET: "",
        CERT_PATH: "",
        KEY_PATH: "",
        HTTP_PORT: "",
        HTTPS_PORT: "",
      },
    },
  ],
};
