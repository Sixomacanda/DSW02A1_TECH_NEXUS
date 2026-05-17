<<<<<<< HEAD
=======
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
}
>>>>>>> e9b0e2e45e1115ea0b63dd8c841cd30bb47d93e8
