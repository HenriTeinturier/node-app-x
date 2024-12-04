window.addEventListener("DOMContentLoaded", () => {
  const imageProfile = document.getElementById("image-profile");
  const inputAvatar = document.getElementById("avatar-input");
  const form = document.getElementById("profile-avatar-form");

  imageProfile.addEventListener("click", () => {
    inputAvatar.click();
  });

  inputAvatar.addEventListener("change", () => {
    form.submit();
  });
});
