window.addEventListener("DOMContentLoaded", () => {
  bindTweet();
});

function bindTweet() {
  const deleteButtonsElements = document.querySelectorAll(".btn-danger");

  deleteButtonsElements.forEach((button) => {
    button.addEventListener("click", () => {
      const tweetId = button.dataset.tweetId;
      fetch(`/tweets/${tweetId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete tweet");
          }
          // on reçois la liste des tweets au format HTML
          return response.text();
        })
        .then((data) => {
          // on remplace le contenu de la div tweet-list-container par la liste des tweets
          document.getElementById("tweet-list-container").innerHTML = data;
          bindTweet();
        })
        .catch((error) => {
          console.error("Error deleting tweet:", error);
        });
    });
  });
}
