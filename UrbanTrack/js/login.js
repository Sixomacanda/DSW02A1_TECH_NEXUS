/*document.getElementById("button").onclick=function(){
    let username=document.getElementById("username").value
    let password=document.getElementById("password").value
    let email=document.getElementById("email").value

   
    if(email[email.length-1]==="m"){
        if(email[email.length-2]==="o"){
            if(email[email.length-3]==="c"){
                if(email[email.length-4]=== "."){
                    if(email[email.length-5]==="l"){
                        if(email [email.length-6]==="i"){
                            if(email[email.length-7]==="a"){
                                if(email[email.length-8]==="m"){
                                    if(email.length[-9]==="g"){
                                        if(email[email.length-10]==="@"){
                                             if(username.length>4){
                                                if(password.length>8){
                                                    alert("login successful")
                                                }
                                                else{
                                                    alert("invalid password")
                                                }

        
    }
    else{
        alert("invalid username")
    }
        */
    
    
                                      



document.getElementById("submit").onclick=function(){

    let text=document.getElementById("text").value
    let password=document.getElementById("password").value
    let email=document.getElementById("email").value


    if(text==""){
        alert("you must fill this field")
        return;
    }
     if(password.length<8 ){
        alert("password must have at least 8 characters")
        return;
    }
    if(! /\d/.test(password)){
        alert("password should also include numbers")
        return;
    }
     if(!email.endswidth("@gmail.com")){
        alert("please enter a correct email address")
        return;
    }
    else{
        alert("your account has been created successfully")
    }
    
};