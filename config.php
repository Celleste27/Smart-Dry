<?php
// config.php
$host = "localhost";
$username = "root";
$password = "";
$database = "smartdry_agro";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>