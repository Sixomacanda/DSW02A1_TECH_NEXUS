document.getElementById("sign").onclick = function(event){
    event.preventDefault();

    let Surname = document.getElementById("surname").value
    let email = document.getElementById("email").value
    let password = document.getElementById("password").value
    let confirm_pass = document.getElementById("confirm-password").value

    let special = /[!@#$%^&*<>?\/,.=+{]/;
    let uppercase = /[A-Z]/;
    let number = /[0-9]/;
// java
    if(Surname.length>2){

        if(email.endsWith("@gmail.com")){

        if(password.length > 8 && special.test(password) && uppercase.test(password) && number.test(password)){

            if(confirm_pass === password){
                
            }
            else{
                alert("Passwords do not match")
            }

        }
        else{
            alert("Password must:\n- Be longer than 8 characters\n- Include a special character\n- Include an uppercase letter\n- Include a number")
        }

    }
    else{
        alert("Invalid email")
    }

    } 
}

// In your login handler, add special admin check:
function initLogin() {
    // ... existing code ...
    
    if (valid) {
        // Special admin hardcoded check
        if (loginEmail.value.trim() === 'admin@urbantrack.com' && 
            loginPassword.value === 'Admin@1234') {
            // Admin login
            const adminUser = {
                id: 'admin_001',
                name: 'Administrator',
                email: 'admin@urbantrack.com',
                role: 'admin'
            };
            setCurrentUser(adminUser);
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // Regular user authentication
        const user = findUserByEmail(loginEmail.value.trim());
        // ... rest of login code
    }
}

function initSignup() {
    // ... existing code ...
    
    if (valid) {
        // Create new user - ALWAYS role: 'user' (never admin)
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
            name: signupSurname.value.trim(),
            email: signupEmail.value.trim().toLowerCase(),
            password: signupPassword.value,
            role: 'user',  // <-- Force role to be 'user'
            createdAt: new Date().toISOString()
        };
        // ... rest of code
    }
}