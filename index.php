<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartDry Agro - Sistem Monitoring Cerdas</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="connection-status">
                <div class="status-dot" id="status-dot"></div>
                <span id="status-text">Connecting...</span>
            </div>

            <div class="header-text">
                <h1>🌾 SmartDry Agro</h1>
                <h2>Sistem Monitoring dan Kontrol Pengeringan Gabah</h2>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="main-nav">
            <a href="#dashboard" class="nav-item active" data-page="dashboard">
                📊 Dashboard
            </a>
            <a href="#notifications" class="nav-item" data-page="notifications">
                🔔 Notifikasi
                <span class="nav-badge" id="notification-badge">3</span>
            </a>
            <a href="#control" class="nav-item" data-page="control">
                ⚙️ Kontrol Sistem
            </a>
        </nav>

        <!-- Dashboard Page -->
        <div id="dashboard-page" class="page active">
            <div class="dashboard-grid">
                <!-- Sensor Cards -->
                <div class="sensor-overview">
                    <div class="sensor-card" id="rainfall-card">
                        <div class="sensor-title">🌧️ Sensor Hujan</div>
                        <div class="sensor-value" id="rainfall-value">10 <span class="sensor-unit">mm</span></div>
                    </div>
                    
                    <div class="sensor-card" id="light-card">
                        <div class="sensor-title">💡 Sensor Cahaya</div>
                        <div class="sensor-value" id="light-value">50 <span class="sensor-unit">lux</span></div>
                    </div>
                    
                    <div class="sensor-card" id="temp-card">
                        <div class="sensor-title">🌡️ Sensor Suhu & Kelembapan</div>
                        <div class="sensor-value" id="temp-humid-value">36°C 85%</div>
                    </div>
                    
                    <div class="sensor-card" id="distance-card">
                        <div class="sensor-title">📦 Sensor Level Gabah</div>
                        <div class="sensor-value" id="distance-value">55 <span class="sensor-unit">cm</span></div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <h3>📈 Statistik Sistem</h3>
                    <div class="stat-item">
                        <span class="stat-label">Notifikasi Aktif:</span>
                        <span class="stat-value" id="active-notifications">3</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Suhu Rata-rata:</span>
                        <span class="stat-value" id="avg-temperature">36°C</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Status Sistem:</span>
                        <span class="stat-value" id="system-status">Aktif</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Uptime:</span>
                        <span class="stat-value" id="system-uptime">99.8%</span>
                    </div>
                </div>
            </div>
            
            <!-- Chart Section -->
            <div class="chart-container">
                <div class="chart-title">Grafik Monitoring Suhu dan Cahaya</div>
                <canvas id="sensorChart"></canvas>
                <div class="time-labels">
                    <span>24 Jam Terakhir</span>
                    <span>Waktu Real-time</span>
                </div>
            </div>
            
            <div class="last-update">
                🔄 Terakhir diperbarui: <span id="update-time"><?= date('H:i:s') ?></span>
            </div>
        </div>

        <!-- Notifications Page -->
        <div id="notifications-page" class="page">
            <div class="notifications-page">
                <div class="notifications-header">
                    <h2>📢 Manajemen Notifikasi & Log Sistem</h2>
                    <div class="notification-actions">
                        <button class="btn-mark-read" onclick="smartDryApp.markAllAsRead()">
                            ✅ Tandai Semua Dibaca
                        </button>
                        <button class="btn-delete" onclick="smartDryApp.clearAllNotifications()">
                            🗑️ Hapus Semua
                        </button>
                    </div>
                </div>

                <!-- Roof Status Indicator -->
                <div class="roof-status">
                    <div class="roof-status-header">
                        <div class="roof-status-title">
                            🏠 Status Atap Pengering
                        </div>
                        <div class="roof-indicator closed">
                            <span class="roof-status-text">Atap Tertutup</span>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <button class="quick-action-btn primary" id="open-roof-btn">
                            🔓 Buka Atap
                        </button>
                        <button class="quick-action-btn" id="close-roof-btn">
                            🔒 Tutup Atap
                        </button>
                        <button class="quick-action-btn" id="test-notification-btn">
                            🧪 Test Notifikasi
                        </button>
                    </div>

                    <!-- Roof Statistics -->
                    <div class="roof-stats">
                        <div class="roof-stat">
                            <div class="roof-stat-value" id="roof-opens">0</div>
                            <div class="roof-stat-label">Atap Dibuka</div>
                        </div>
                        <div class="roof-stat">
                            <div class="roof-stat-value" id="roof-closes">0</div>
                            <div class="roof-stat-label">Atap Ditutup</div>
                        </div>
                        <div class="roof-stat">
                            <div class="roof-stat-value" id="rain-events">0</div>
                            <div class="roof-stat-label">Kejadian Hujan</div>
                        </div>
                    </div>
                </div>

                <!-- Notification Stats -->
                <div class="notification-stats">
                    <div class="stat-badge">
                        <span>📨 Total Notifikasi: <strong id="total-notifications">5</strong></span>
                    </div>
                    <div class="stat-badge unread">
                        <span>🔔 Belum Dibaca: <strong id="unread-notifications">3</strong></span>
                    </div>
                </div>

                <!-- Filter Buttons -->
                <div class="notification-filters">
                    <button class="filter-btn active" data-filter="all">📋 Semua</button>
                    <button class="filter-btn" data-filter="unread">👁️ Belum Dibaca</button>
                    <button class="filter-btn" data-filter="warning">⚠️ Peringatan</button>
                    <button class="filter-btn" data-filter="error">❌ Error</button>
                </div>

                <!-- Notifications List -->
                <div class="notifications-list-full" id="notifications-list-full">
                    <!-- Notifications will be loaded here -->
                </div>

                <!-- Log History Section -->
                <div class="log-history">
                    <h3>📝 Log Riwayat Sistem</h3>
                    
                    <!-- Log Tabs -->
                    <div class="log-tabs">
                        <button class="log-tab active" data-filter="all">Semua Aktivitas</button>
                        <button class="log-tab" data-filter="roof">Atap</button>
                        <button class="log-tab" data-filter="system">Sistem</button>
                        <button class="log-tab" data-filter="rain">Hujan</button>
                    </div>

                    <!-- Log Items -->
                    <div class="log-items" id="log-items">
                        <!-- Log items will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

    <script src="js/script.js"></script>
</body>
</html>