<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("open");
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("open");
  // Clear sensitive inputs on close
  if (modalId === "deleteModal") {
    document.getElementById("deleteConfirmInput").value = "";
    document.getElementById("deletePasswordInput").value = "";
    document.getElementById("deleteConfirmBtn").disabled = true;
  }
}

// Section navigation
function showSection(sectionId, element) {
  // Hide all sections
  document.querySelectorAll(".panel-section").forEach(section => {
    section.classList.remove("active");
  });
  // Remove active class from nav items
  document.querySelectorAll(".snav-item").forEach(item => {
    item.classList.remove("active");
  });
  
  // Show selected section
  const section = document.getElementById(`section-${sectionId}`);
  if (section) section.classList.add("active");
  
  // Add active class to clicked nav item
  if (element) element.classList.add("active");
}

// Delete confirmation check
function checkDeleteConfirm() {
  const confirmText = document.getElementById("deleteConfirmInput").value;
  const password = document.getElementById("deletePasswordInput").value;
  const btn = document.getElementById("deleteConfirmBtn");
  
  btn.disabled = !(confirmText === "DELETE" && password.trim().length > 0);
}

// Delete account function
async function deleteAccount() {
  const password = document.getElementById("deletePasswordInput").value;
  const currentUser = JSON.parse(localStorage.getItem("urbanTrack_currentUser") || "null");
  const user = auth.currentUser;

  if (!user || !currentUser) {
    alert("User not found. Please log in again.");
=======
=======
>>>>>>> 5a4397e34ac5e70efa640bae2c2fe871ee2df6ba
async function deleteAccount() {
  const user = auth.currentUser;

  if (!user) {
    alert("No user logged in");
    return;
  }

  const confirmText = document.getElementById("deleteConfirmInput").value;

  if (confirmText !== "DELETE") {
    alert("Type DELETE to confirm");
<<<<<<< HEAD
>>>>>>> 4ce2eb5006afd9825067a18a711f6a48422db0f0
=======
>>>>>>> 5a4397e34ac5e70efa640bae2c2fe871ee2df6ba
    return;
  }

  try {
<<<<<<< HEAD
<<<<<<< HEAD
    // Reauthenticate user with password
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // Delete all reports by this user
    const reportsQuery = query(collection(db, "reports"), where("reportedBy", "==", user.uid));
    const reportsSnapshot = await getDocs(reportsQuery);
    
    for (const reportDoc of reportsSnapshot.docs) {
      await deleteDoc(doc(db, "reports", reportDoc.id));
    }

    // Delete user document from Firestore
    try {
      await deleteDoc(doc(db, "users", user.uid));
    } catch (err) {
      console.warn("User document not found, continuing with auth deletion...");
    }

    // Delete user from Firebase Authentication
    await deleteUser(user);

    // Clear localStorage
    localStorage.removeItem("urbanTrack_currentUser");
    localStorage.removeItem("userEmail");

    alert("Your account and all associated data have been permanently deleted.");
    
    // Redirect to home page
    window.location.href = "../../homePage.html";

  } catch (error) {
    console.error("Delete account error:", error);
    
    if (error.code === "auth/wrong-password") {
      alert("Incorrect password. Please try again.");
    } else if (error.code === "auth/requires-recent-login") {
      alert("For security, please log in again and try deleting your account.");
    } else {
      alert("Error deleting account: " + error.message);
    }
  }
}

// Toggle functions for settings
function saveToggle(element, label) {
  const isChecked = element.checked;
  console.log(`${label}: ${isChecked}`);
  showToast(`${label} ${isChecked ? "enabled" : "disabled"}`, "info");
}

// Toast notification
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  
  toast.textContent = message;
  const classType = type === "info" ? "show" : type;
  toast.className = `toast show ${classType}`;
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Deactivate account (temporary)
function deactivateAccount() {
  alert("Account deactivation feature coming soon.");
  closeModal("deactivateModal");
}

// Sign out all sessions
function signOutAll() {
  alert("Sign out all sessions feature coming soon.");
  closeModal("signoutAllModal");
}

// Make functions global
window.openModal = openModal;
window.closeModal = closeModal;
window.showSection = showSection;
window.checkDeleteConfirm = checkDeleteConfirm;
window.deleteAccount = deleteAccount;
window.saveToggle = saveToggle;
window.showToast = showToast;
window.deactivateAccount = deactivateAccount;
window.signOutAll = signOutAll;
=======
=======
>>>>>>> 5a4397e34ac5e70efa640bae2c2fe871ee2df6ba
    const userId = user.uid;

    // 1. Delete user data from Firestore
    await deleteDoc(doc(db, "users", userId));

    // 2. Delete auth account
    await deleteUser(user);

    alert("Account deleted successfully");

    // redirect
    window.location.href = "login.html";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/requires-recent-login") {
      alert("Please log in again before deleting.");
    } else {
      alert("Error deleting account");
    }
  }
<<<<<<< HEAD
}
>>>>>>> 4ce2eb5006afd9825067a18a711f6a48422db0f0
=======
}
>>>>>>> 5a4397e34ac5e70efa640bae2c2fe871ee2df6ba
=======
>>>>>>> 8985b8fd27a4320938f2957ed9b03b9a0c194500
=======
>>>>>>> 8985b8fd27a4320938f2957ed9b03b9a0c194500
