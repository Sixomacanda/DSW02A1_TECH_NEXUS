<<<<<<< HEAD
=======
document.addEventListener("DOMContentLoaded", () => {
  const saveNameBtn = document.getElementById("saveNameBtn");
  if (saveNameBtn) {
    saveNameBtn.addEventListener("click", (e) => {
      e.preventDefault();
      saveName(); // call your function
    });
  }


// Override Save Email button
const saveEmailBtn = document.getElementById("saveEmailBtn");
if (saveEmailBtn) {
  saveEmailBtn.addEventListener("click", (e) => {
    e.preventDefault();
    saveEmail();
  });
}

// Override Delete Account confirm button
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
if (deleteConfirmBtn) {
  deleteConfirmBtn.addEventListener("click", (e) => {
    e.preventDefault();
    deleteAccount();
  });
}
});



// Define the function separately
>>>>>>> 5d07c4cf995450fc05aa062128ad95573fde3017
async function deleteAccount() {
  const user = auth.currentUser;

  if (!user) {
    alert("No user logged in");
    return;
  }

  const confirmText = document.getElementById("deleteConfirmInput").value;
<<<<<<< HEAD

=======
>>>>>>> 5d07c4cf995450fc05aa062128ad95573fde3017
  if (confirmText !== "DELETE") {
    alert("Type DELETE to confirm");
    return;
  }

  try {
    const userId = user.uid;

    // 1. Delete user data from Firestore
    await deleteDoc(doc(db, "users", userId));

    // 2. Delete auth account
    await deleteUser(user);

    alert("Account deleted successfully");

<<<<<<< HEAD
    // redirect
=======
    // Redirect to login
>>>>>>> 5d07c4cf995450fc05aa062128ad95573fde3017
    window.location.href = "login.html";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/requires-recent-login") {
      alert("Please log in again before deleting.");
    } else {
      alert("Error deleting account");
    }
  }
}
