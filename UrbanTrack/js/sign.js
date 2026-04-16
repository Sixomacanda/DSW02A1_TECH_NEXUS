document.getElementById("sign").onclick = function(event){

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