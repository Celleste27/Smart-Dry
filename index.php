<?php
require_once "db_connect.php";
require_once "notifications.php";

// Buat objek sistem notifikasi
$notif = new NotificationSystem($db);

// Contoh data sensor (bisa diubah untuk simulasi)
$data = [
    'temperature' => 36,
    'humidity' => 85,
    'rainfall' => 10,
    'light_intensity' => 50,
    'distance' => 55
];

// Jalankan pengecekan ambang batas sensor
$notifications = checkSensorThresholds($data, $notif);

// Ambil semua notifikasi terbaru
$recent = $notif->getRecentNotifications(10);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartDry Agro</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="connection-status">
                <div class="status-dot" id="status-dot"></div>
                <span id="status-text">Connecting...</span>
            </div>

            <div class="header-text">
                <h1>SmartDry Agro</h1>
                <h2>Data Sensor Real-time</h2>
            </div>

            <!-- Menu Navigasi -->
            <div class="menu-nav">
                <a href="#" class="active">Dashboard</a>
                <a href="#" id="notifications-tab">Notifikasi <span class="notification-badge" id="notification-badge"><?= count($recent) ?></span></a>
                <a href="#">Kontrol</a>
            </div>
        </div>

        <!-- Panel Notifikasi -->
        <div class="notifications-panel" id="notifications-panel">
            <div class="notifications-header">
                <h3>📢 Notifikasi Sistem</h3>
                <div class="notification-actions">
                    <button id="mark-all-read">Tandai Sudah Dibaca</button>
                    <button id="clear-notifications">Bersihkan Semua</button>
                </div>
            </div>

            <div class="notifications-list" id="notifications-list">
                <?php if (count($recent) > 0): ?>
                    <?php foreach ($recent as $r): ?>
                        <div class="notification-item">
                            <p><?= htmlspecialchars($r['message']) ?></p>
                            <span class="notif-time"><?= $r['created_at'] ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="notification-placeholder">
                        <p>Tidak ada notifikasi</p>
                    </div>
                <?php endif; ?>
            </div>

            <div class="notifications-footer">
                <span id="notification-count"><?= count($recent) ?> notifikasi</span>
                <span class="last-update-notif">Terakhir diperbarui: <span id="notif-update-time"><?= date('H:i:s') ?></span></span>
            </div>
        </div>
        
        <!-- Sensor Grid -->
        <div class="sensor-grid">
            <div class="sensor-card" id="rainfall-card">
                <div class="sensor-title">Sensor Hujan</div>
                <div class="sensor-value" id="rainfall-value"><?= $data['rainfall'] ?> <span class="sensor-unit">mm</span></div>
            </div>
            
            <div class="sensor-card" id="light-card">
                <div class="sensor-title">Sensor Cahaya</div>
                <div class="sensor-value" id="light-value"><?= $data['light_intensity'] ?> <span class="sensor-unit">lux</span></div>
            </div>
            
            <div class="sensor-card" id="temp-card">
                <div class="sensor-title">Sensor Suhu & Kelembapan</div>
                <div class="sensor-value" id="temp-humid-value"><?= $data['temperature'] ?>°C <?= $data['humidity'] ?>%</div>
            </div>
            
            <div class="sensor-card" id="distance-card">
                <div class="sensor-title">Sensor Ultrasonic</div>
                <div class="sensor-value" id="distance-value"><?= $data['distance'] ?> <span class="sensor-unit">cm</span></div>
            </div>
        </div>
        
        <!-- Grafik -->
        <div class="chart-container">
            <div class="chart-title">Grafik Suhu dan Cahaya</div>
            <canvas id="sensorChart"></canvas>
            <div class="time-labels">
                <span>24 Jam</span>
                <span>Sekarang</span>
            </div>
        </div>
        
        <div class="last-update">
            Terakhir diperbarui: <span id="update-time"><?= date('H:i:s') ?></span>
        </div>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
