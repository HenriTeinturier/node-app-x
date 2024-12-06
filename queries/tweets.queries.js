const Tweet = require("../database/models/tweet.model");
const User = require("../database/models/user.model");

exports.getTweets = async () => {
  return await Tweet.find({}).sort({ createdAt: -1 });
};

exports.getTweetsWithAuthors = async () => {
  return await Tweet.find({})
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};

exports.getCurrentUserTweetsWithFollowing = async (user) => {
  return await Tweet.find({
    author: { $in: [user._id, ...user.following] },
  })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};

exports.getTweetsFromUsername = async (username) => {
  // nous avons besoin de récupérer l'utilisateur à partir de son username afin de récupérer son _id
  const user = await User.findOne({ username: username });
  if (!user) {
    throw new Error("User not found");
  }

  // en effet, dans le tweet model il n'y a pas le username pour faire une recherche
  return await Tweet.find({ author: user._id })
    .populate("author", "username avatar")
    .sort({ createdAt: -1 });
};

exports.createTweet = async (tweet, userId) => {
  const newTweet = new Tweet({ ...tweet, author: userId });
  return newTweet.save();
};

exports.deleteTweet = async (id) => {
  return await Tweet.findByIdAndDelete(id);
};

exports.getTweetById = async (id) => {
  return await Tweet.findById(id);
  // ou Tweet.findOne({ _id: id });
};

exports.updateTweet = async (id, body) => {
  return await Tweet.findByIdAndUpdate(id, body, { runValidators: true });
};
