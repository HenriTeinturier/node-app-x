window.addEventListener("DOMContentLoaded", () => {
  const searchMenu = document.querySelector(".search-menu");
  const searchInput = document.getElementById("search-input");

  let ref = null;

  // Quand on tape dans l'input, on lance la recherche au bout de 300ms
  searchInput.addEventListener("input", (e) => {
    // annule le timeout précedent
    if (ref) {
      clearTimeout(ref);
    }

    // démarre un nouveau timeout
    ref = setTimeout(() => {
      // envoi d'une requête à l'API
      fetch(`/users?search=${e.target.value}`)
        .then((res) => res.text())
        .then((html) => {
          // on remplace le contenu de searchMenu par le html reçu
          searchMenu.innerHTML = html;
          // on ajoute la classe show si le contenu de searchMenu n'est pas vide
          if (searchMenu.innerHTML !== "") {
            searchMenu.classList.add("show");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }, 300);
  });

  searchMenu.addEventListener("click", (e) => {
    // pour que le click arrête les actions suivantes
    // sinon le click se propage à la fenêtre et cache le menu
    e.stopPropagation();
  });

  // Quand on clique en dehors de la barre de recherche ou de l'input, on cache le menu de recherche
  window.addEventListener("click", (e) => {
    if (e.target !== searchMenu && e.target !== searchInput) {
      searchMenu.classList.remove("show");
    }
  });

  // On réaffiche le menu si on focus l'input
  searchInput.addEventListener("focus", () => {
    if (searchMenu.innerHTML !== "") {
      searchMenu.classList.add("show");
    }
  });
});
