
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4Wy3nmsbaUWGF-rh6ubXvCmAAKhho49U",
  authDomain: "urban-track-91e53.firebaseapp.com",
  projectId: "urban-track-91e53",
  storageBucket: "urban-track-91e53.firebasestorage.app",
  messagingSenderId: "519209303536",
  appId: "1:519209303536:web:c212eb58eb836e27047135"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById("log").addEventListener("click", function(e){

  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {

    const user = userCredential.user;

    // Store email for simple display scripts
    localStorage.setItem("userEmail", user.email);

    // Store user object for the dashboard logic to display the email at the top
    localStorage.setItem("urbanTrack_currentUser", JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: user.email // Set name to email so it appears in the welcome message
    }));

    window.location.href = "MainPage.html";

  })
  .catch((error) => {
    alert(error.message);
  });

});
function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const loginEmail = document.getElementById("text");
  const loginPassword = document.getElementById("password");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    // Email validation
    if (!loginEmail.value.trim()) {
      setError(loginEmail, "Email is required.");
      valid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
      setError(loginEmail, "Please enter a valid email address.");
      valid = false;
    } else {
      clearError(loginEmail);
    }

    // Password validation
    if (!loginPassword.value.trim()) {
      setError(loginPassword, "Password is required.");
      valid = false;
      // } else if (loginPassword.value.length < 6) {
      //     setError(loginPassword, "Password must be at least 6 characters.");
      //     valid = false;
    } else {
      clearError(loginPassword);
    }

    
  });
}