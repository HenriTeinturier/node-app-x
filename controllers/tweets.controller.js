const {
  getTweetsWithAuthors,
  createTweet,
  deleteTweet,
  getTweetById,
  updateTweet,
  getTweets,
} = require("../queries/tweets.queries");

exports.tweetList = async (req, res, next) => {
  try {
    const tweets = await getTweetsWithAuthors();
    res.render("layout", {
      content: "tweets/tweets",
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.tweetNew = async (req, res, next) => {
  res.render("layout", {
    content: "tweets/tweet-form",
    errors: undefined,
    tweet: undefined,
    isAuthenticated: req.isAuthenticated(),
    currentUser: req.user,
  });
};

exports.tweetCreate = async (req, res, next) => {
  try {
    await createTweet(req.body, req.user._id);
    res.redirect("/tweets");
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      (key) => err.errors[key].message
    );
    res.status(400).render("layout", {
      content: "tweets/tweet-form",
      errors: errors,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  }
};

exports.tweetDelete = async (req, res, next) => {
  try {
    const { tweetId } = req.params;
    await deleteTweet(tweetId);
    // res.redirect("/tweets");
    // on renvoi plutôt un partial de la liste des tweets
    const tweets = await getTweets();
    res.render("tweets/partials/tweet-list", {
      tweets: tweets,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.tweetEdit = async (req, res, next) => {
  try {
    const tweetId = req.params.tweetId;
    const tweet = await getTweetById(tweetId);
    res.render("layout", {
      content: "tweets/tweet-form",
      tweet: tweet,
      errors: undefined,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.tweetUpdate = async (req, res, next) => {
  const tweetId = req.params.tweetId;
  const body = req.body;
  try {
    await updateTweet(tweetId, body);
    res.redirect("/tweets");
  } catch (err) {
    const errors = Object.keys(err.errors).map(
      (key) => err.errors[key].message
    );
    // const tweet = await getTweetById(tweetId);
    const tweet = { _id: tweetId, ...body };
    res.status(400).render("layout", {
      content: "tweets/tweet-form",
      tweet: tweet,
      errors: errors,
      isAuthenticated: req.isAuthenticated(),
      currentUser: req.user,
    });
  }
};
