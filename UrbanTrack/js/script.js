// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4Wy3nmsbaUWGF-rh6ubXvCmAAKhho49U",
  authDomain: "urban-track-91e53.firebaseapp.com",
  projectId: "urban-track-91e53",
  storageBucket: "urban-track-91e53.firebasestorage.app",
  messagingSenderId: "519209303536",
  appId: "1:519209303536:web:c212eb58eb836e27047135"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let passwordregex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
let emailregex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let surnameRegex = /^[a-zA-Z]+$/;

// Signup button
document.getElementById("signing").onclick = function (event) {

  

  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("Signup-password").value;
  const surname = document.getElementById("surname").value;
  const confirmPassword = document.getElementById("Signup-confirm-password").value;
    if(email === "" || password === "" || surname === "" || confirmPassword === ""){
    alert("Please fill in all fields");
    return;
  }
  else{

    let valid = passwordregex.test(password) && emailregex.test(email) && surnameRegex.test(surname);

  if (valid) {

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    else {
      // Firebase signup
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          const user = userCredential.user;
          
          // Save user profile to Firestore
          await setDoc(doc(db, "users", user.uid), {
            email: email,
            surname: surname,
            name: surname,
            role: 'Member',
            status: 'approved', // Or 'pending' if you want admin approval required
            createdAt: serverTimestamp(),
            reportsCount: 0
          });

          alert("Account created successfully");
          window.location.href = "login.html";
          console.log(user);
        })
        .catch((error) => {
          alert("Error creating account: " + error.message);
        });
    }

  }
  else {
    alert("Invalid input. Please ensure:\n- Password is at least 8 characters, includes uppercase, lowercase, number, and special character.\n- Email is in correct format.\n- Surname contains only letters.");
      }}};