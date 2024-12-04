const Tweet = require("../database/models/tweet.model");

exports.getTweets = async () => {
  return await Tweet.find({}).sort({ createdAt: -1 });
};

exports.getTweetsWithAuthors = async () => {
  return await Tweet.find({})
    .populate("author", "username")
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
