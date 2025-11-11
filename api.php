<?php
// api.php - Versi sederhana
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid JSON data"]);
        exit;
    }
    
    // Validasi data yang diperlukan
    if (!isset($data['temperature']) || !isset($data['humidity'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit;
    }
    
    // Simpan ke database
    if (saveToDatabase($data)) {
        echo json_encode(["status" => "success", "message" => "Data saved successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to save data"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

function saveToDatabase($data) {
    $host = "localhost";
    $username = "root";
    $password = "";
    $database = "smartdry_agro";

    try {
        $conn = new mysqli($host, $username, $password, $database);
        
        if ($conn->connect_error) {
            error_log("Database connection failed: " . $conn->connect_error);
            return false;
        }

        $temperature = floatval($data['temperature']);
        $humidity = floatval($data['humidity']);
        $light_intensity = isset($data['light_intensity']) ? floatval($data['light_intensity']) : 0;
        $rainfall = isset($data['rainfall']) ? floatval($data['rainfall']) : 0;
        $distance = isset($data['distance']) ? floatval($data['distance']) : 0;

        $stmt = $conn->prepare(
            "INSERT INTO sensor_readings (temperature, humidity, light_intensity, rainfall, distance) 
             VALUES (?, ?, ?, ?, ?)"
        );
        
        if (!$stmt) {
            error_log("Prepare failed: " . $conn->error);
            $conn->close();
            return false;
        }
        
        $stmt->bind_param("ddddd", $temperature, $humidity, $light_intensity, $rainfall, $distance);
        $result = $stmt->execute();
        
        $stmt->close();
        $conn->close();
        
        return $result;
        
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
}
?>