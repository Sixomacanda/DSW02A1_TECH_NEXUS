document.addEventListener("DOMContentLoaded", () => {
  // Override Save Name button
  const saveNameBtn = document.getElementById("saveNameBtn");
  if (saveNameBtn) {
    saveNameBtn.addEventListener("click", (e) => {
      e.preventDefault(); // block default form submission
      saveName();         // call your existing function
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
async function deleteAccount() {
  const user = auth.currentUser;

  if (!user) {
    alert("No user logged in");
    return;
  }

  const confirmText = document.getElementById("deleteConfirmInput").value;
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

    // Redirect to login
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
