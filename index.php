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

            <!-- Tambahan menu navigasi -->
            <div class="menu-nav">
                <a href="#" class="active">Dashboard</a>
                <a href="#">Notifikasi</a>
                <a href="#">Kontrol</a>
            </div>
        </div>
        
        <div class="sensor-grid">
            <div class="sensor-card" id="rainfall-card">
                <div class="sensor-title">Sensor Hujan</div>
                <div class="sensor-value" id="rainfall-value">0 <span class="sensor-unit">mm</span></div>
            </div>
            
            <div class="sensor-card" id="light-card">
                <div class="sensor-title">Sensor Cahaya</div>
                <div class="sensor-value" id="light-value">0 <span class="sensor-unit">lux</span></div>
            </div>
            
            <div class="sensor-card" id="temp-card">
                <div class="sensor-title">Sensor Suhu & Kelembapan</div>
                <div class="sensor-value" id="temp-humid-value">0°C 0%</div>
            </div>
            
            <div class="sensor-card" id="distance-card">
                <div class="sensor-title">Sensor Ultrasonic</div>
                <div class="sensor-value" id="distance-value">0 <span class="sensor-unit">cm</span></div>
            </div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Grafik Suhu dan Cahaya</div>
            <canvas id="sensorChart"></canvas>
            <div class="time-labels">
                <span>24 Jam</span>
                <span>Sekarang</span>
            </div>
        </div>
        
        <div class="last-update">
            Terakhir diperbarui: <span id="update-time">-</span>
        </div>
    </div>

    <script src="js/script.js"></script>
</body>
</html>
