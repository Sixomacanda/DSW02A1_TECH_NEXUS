const passwordInput = document.querySelector("#Signup-password");
const confirmPasswordInput = document.querySelector("#Signup-confirm-password");

const passwordGroups = document.querySelectorAll(".password-group");

passwordGroups.forEach((group) => {
  const input = group.querySelector("input");
  const show = group.querySelector(".fa-eye");
  const hide = group.querySelector(".fa-eye-slash");

  show.addEventListener("click", () => {
    input.type = "text";
    hide.classList.remove("hide");
    show.classList.add("hide");
  });

  hide.addEventListener("click", () => {
    input.type = "password";
    hide.classList.add("hide");
    show.classList.remove("hide");
  });
});
