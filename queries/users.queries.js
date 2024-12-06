const User = require("../database/models/user.model");

exports.createUser = async (user) => {
  try {
    const hashedPassword = await User.hashPassword(user.password);

    const newUser = new User({
      username: user.username,
      email: user.email,
      local: {
        password: hashedPassword,
      },
    });
    return newUser.save();
  } catch (error) {
    throw error;
  }
};

exports.findUserByEmail = async (email) => {
  return User.findOne({ email });
};

exports.findUserById = async (_id) => {
  return User.findById(_id);
};

exports.getUserByUsername = async (username) => {
  return await User.findOne({ username: username });
};

exports.searchUsersByUsername = async (search) => {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // N'accepte que les lettres, chiffres et quelques caractères spéciaux
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(search)) {
    throw new Error("Caractères non autorisés");
  }

  return await User.find(
    { username: { $regex: escapedSearch, $options: "i" } },
    { username: 1, avatar: 1, _id: 1 }
  );
};
