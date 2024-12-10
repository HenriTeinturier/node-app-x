const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

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

// Middleware de validation
userSchema.pre("validate", function (next) {
  if (!this.local.password && !this.google.id) {
    next(new Error("Un mot de passe ou un Google ID est requis."));
  } else {
    next();
  }
});

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 12); // 12 est le nombre de salt rounds
};

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.local.password);
};

const User = mongoose.model("user", userSchema);

module.exports = User;
