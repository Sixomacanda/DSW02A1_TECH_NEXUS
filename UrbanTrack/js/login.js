/*document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirm-password").value;

    if (password.length < 8) {
        alert("Password must have at least 8 characters");
        return;
    }

    if (!/\d/.test(password)) {
        alert("Password must include numbers");
        return;
    }

    if (!email.endsWith("@gmail.com")) {
        alert("Please enter a valid email");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    localStorage.setItem("email", email);
    localStorage.setItem("password", password);

    alert("Account created successfully!");

    
    window.location.href = "login.php";
});

document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    let username = document.getElementById("text").value;
    let password = document.getElementById("password").value;

    let savedEmail = localStorage.getItem("email");
    let savedPassword = localStorage.getItem("password");

    
    if (username === savedEmail && password === savedPassword) {
        alert("✅ Login successful!");
    } else {
        alert("❌ Incorrect username or password");
    }
});


//homePage Code
 function scrollToAbout() {
      document.getElementById("about").scrollIntoView({ behavior: "smooth" });
    }

    function search() {
      let query = document.getElementById("search").value;
      alert("You searched for: " + query);
    }*/