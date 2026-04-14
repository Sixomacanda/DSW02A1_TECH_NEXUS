<?php
include("connection.php");

error_reporting(E_ALL);
ini_set('display_errors',1);

if(isset($_POST['Signup_'])){

$surname = trim($_POST['surname_']);
$email = trim($_POST['email_']);
$password = $_POST['password_'];
$confirm_pass = $_POST['confirm-password_'];

$errors = [];

/* VALIDATION */

if(strlen($surname) < 3){
$errors[] = "Surname must be at least 3 characters.";
}

if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
$errors[] = "Invalid email.";
}

if($password !== $confirm_pass){
$errors[] = "Passwords do not match.";
}

/* here we are checking the email already exist or not  */

$stmt = $conn->prepare("SELECT Email FROM boy_table WHERE Email = ?");
$stmt->bind_param("s",$email);
$stmt->execute();
$stmt->store_result();

if($stmt->num_rows > 0){
$errors[] = "Email already registered.";
}

$stmt->close();

/* check if akhona yini ama errors before we insert the user to database*/

if(empty($errors)){

$stmt = $conn->prepare("INSERT INTO boy_table (Surname, Email, Password) VALUES (?, ?, ?)");
$stmt->bind_param("sss",$surname,$email,$password);

if($stmt->execute()){
header("Location: index.html");
    exit();
    
        

}else{
echo "Error: ".$stmt->error;
}

$stmt->close();
$conn->close();

}else{

foreach($errors as $error){
echo "<p style='color:red;'>$error</p>";
}

}

}
?>