<?php
$penjemuran = isset($_POST['penjemuran']) ? "on" : "off";
$penutup = isset($_POST['penutup']) ? "on" : "off";
$ventilator = isset($_POST['ventilator']) ? "on" : "off";

header("Location: index.php?penjemuran=$penjemuran&penutup=$penutup&ventilator=$ventilator");
exit;
?>
