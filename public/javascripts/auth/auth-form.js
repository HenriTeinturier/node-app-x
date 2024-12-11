window.addEventListener("DOMContentLoaded", () => {
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
      event.preventDefault();
      Swal.fire({
        title: "Mot de passe oublié",
        input: "email", // Utiliser 'input' au lieu de 'content'
        inputPlaceholder: "Entrez votre email",
      })
        .then((result) => {
          const email = result.value;
          if (email) {
            fetch(`/users/forgot-password`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email }),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Erreur réseau");
                }
                return response.json();
              })
              .then((data) => {
                Swal.fire({
                  title: "Mot de passe oublié",
                  text:
                    "Un email de réinitialisation de mot de passe a été envoyé à " +
                    email,
                  icon: "success",
                });
              })
              .catch((error) => {
                Swal.fire({
                  title: "Erreur",
                  text: "Une erreur est survenue lors de l'envoi de l'email",
                });
              });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }
});
