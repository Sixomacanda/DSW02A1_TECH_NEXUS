<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "boy_dtbs";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

?> 