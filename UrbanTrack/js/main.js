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

function validateEmail(value) {
  return /\S+@\S+\.\S+/.test(value);
}

function setError(input, message) {
  const formGroup = input.closest(".form-group");
  const error = formGroup ? formGroup.querySelector(".error") : null;
  if (error) {
    error.textContent = message;
  }
  input.classList.add("input-error");
}

function clearError(input) {
  const formGroup = input.closest(".form-group");
  const error = formGroup ? formGroup.querySelector(".error") : null;
  if (error) {
    error.textContent = "";
  }
  input.classList.remove("input-error");
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const loginEmail = document.getElementById("text");
  const loginPassword = document.getElementById("password");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!loginEmail.value.trim()) {
      setError(loginEmail, "Email is required.");
      valid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
      setError(loginEmail, "Please enter a valid email address.");
      valid = false;
    } else {
      clearError(loginEmail);
    }

    if (!loginPassword.value.trim()) {
      setError(loginPassword, "Password is required.");
      valid = false;
    } else if (loginPassword.value.length < 6) {
      setError(loginPassword, "Password must be at least 6 characters.");
      valid = false;
    } else {
      clearError(loginPassword);
    }

    if (valid) {
      console.log("Login form valid");
      // loginForm.submit(); // If you want native submit after validation
    }
  });
}

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  const signupSurname = document.getElementById("surname");
  const signupEmail = document.getElementById("email");
  const signupPassword = document.getElementById("Signup-password");
  const signupConfirm = document.getElementById("Signup-confirm-password");

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    if (!signupSurname.value.trim()) {
      setError(signupSurname, "Surname is required.");
      valid = false;
    } else {
      clearError(signupSurname);
    }

    if (!signupEmail.value.trim()) {
      setError(signupEmail, "Email is required.");
      valid = false;
    } else if (!validateEmail(signupEmail.value.trim())) {
      setError(signupEmail, "Please enter a valid email address.");
      valid = false;
    } else {
      clearError(signupEmail);
    }

    if (!signupPassword.value.trim()) {
      setError(signupPassword, "Password is required.");
      valid = false;
    } else if (signupPassword.value.length < 6) {
      setError(signupPassword, "Password must be at least 6 characters.");
      valid = false;
    } else {
      clearError(signupPassword);
    }

    if (!signupConfirm.value.trim()) {
      setError(signupConfirm, "Confirm the password.");
      valid = false;
    } else if (signupConfirm.value !== signupPassword.value) {
      setError(signupConfirm, "Passwords do not match.");
      valid = false;
    } else {
      clearError(signupConfirm);
    }

    if (valid) {
      console.log("Signup form valid");
      // signupForm.submit();
    }
  });
}
