<?php
session_start();
include("connection.php");

if(isset($_POST['login_'])){

$email = trim($_POST['email_']);
$password = trim($_POST['password_']);

$stmt = $conn->prepare("SELECT Password FROM boy_table WHERE Email = ?");

if(!$stmt){
die("Query failed: " . $conn->error);
}

$stmt->bind_param("s",$email);
$stmt->execute();

$result = $stmt->get_result();

if($result->num_rows > 0){

$row = $result->fetch_assoc();
$db_password = $row['Password'];

if($password === $db_password){

$_SESSION['email'] = $email;

header("Location: Home.html");
exit();

}else{

echo "Incorrect password";

}

}else{

echo "Email not registered";

}

$stmt->close();

}
?>