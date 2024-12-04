const router = require("express").Router();
const {
  tweetCreate,
  tweetList,
  tweetNew,
  tweetDelete,
  tweetEdit,
  tweetUpdate,
} = require("../controllers/tweets.controller");

router.post("/", tweetCreate);
router.get("/edit/:tweetId", tweetEdit);
router.post("/update/:tweetId", tweetUpdate);

router.get("/", tweetList);

router.get("/new", tweetNew);

router.delete("/:tweetId", tweetDelete);

module.exports = router;
