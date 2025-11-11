<?php
// notifications.php
class NotificationSystem {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function addNotification($type, $message, $sensor_data = null) {
        $stmt = $this->db->prepare(
            "INSERT INTO notifications (type, message, sensor_data, created_at) 
             VALUES (?, ?, ?, NOW())"
        );
        
        $sensor_json = $sensor_data ? json_encode($sensor_data) : null;
        $stmt->bind_param("sss", $type, $message, $sensor_json);
        
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    public function getRecentNotifications($limit = 10) {
        $stmt = $this->db->prepare(
            "SELECT * FROM notifications 
             ORDER BY created_at DESC 
             LIMIT ?"
        );
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $notifications = $result->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();
        return $notifications;
    }
    
    public function getUnreadNotifications($limit = 10) {
        $stmt = $this->db->prepare(
            "SELECT * FROM notifications 
             WHERE is_read = 0 
             ORDER BY created_at DESC 
             LIMIT ?"
        );
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $notifications = $result->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();
        return $notifications;
    }
    
    public function markAsRead($notification_id) {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET is_read = 1 WHERE id = ?"
        );
        $stmt->bind_param("i", $notification_id);
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    public function markAllAsRead() {
        $stmt = $this->db->prepare(
            "UPDATE notifications SET is_read = 1 WHERE is_read = 0"
        );
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    public function getNotificationCount() {
        $result = $this->db->query(
            "SELECT COUNT(*) as total FROM notifications WHERE is_read = 0"
        );
        $count = $result->fetch_assoc();
        return $count['total'];
    }
    
    public function deleteOldNotifications($days = 30) {
        $stmt = $this->db->prepare(
            "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)"
        );
        $stmt->bind_param("i", $days);
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    public function getNotificationsByType($type, $limit = 50) {
        $stmt = $this->db->prepare(
            "SELECT * FROM notifications 
             WHERE type = ? 
             ORDER BY created_at DESC 
             LIMIT ?"
        );
        $stmt->bind_param("si", $type, $limit);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $notifications = $result->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();
        return $notifications;
    }
}

// Class untuk log riwayat
class LogSystem {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function addLog($type, $action, $message, $status = null) {
        $stmt = $this->db->prepare(
            "INSERT INTO system_logs (type, action, message, status, created_at) 
             VALUES (?, ?, ?, ?, NOW())"
        );
        
        $stmt->bind_param("ssss", $type, $action, $message, $status);
        $result = $stmt->execute();
        $stmt->close();
        
        return $result;
    }
    
    public function getRecentLogs($limit = 50) {
        $stmt = $this->db->prepare(
            "SELECT * FROM system_logs 
             ORDER BY created_at DESC 
             LIMIT ?"
        );
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $logs = $result->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();
        return $logs;
    }
    
    public function getLogsByType($type, $limit = 50) {
        $stmt = $this->db->prepare(
            "SELECT * FROM system_logs 
             WHERE type = ? 
             ORDER BY created_at DESC 
             LIMIT ?"
        );
        $stmt->bind_param("si", $type, $limit);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $logs = $result->fetch_all(MYSQLI_ASSOC);
        
        $stmt->close();
        return $logs;
    }
    
    public function getRoofStatistics() {
        $stats = [];
        
        // Count roof opens
        $result = $this->db->query(
            "SELECT COUNT(*) as count FROM system_logs 
             WHERE type = 'roof' AND action = 'open'"
        );
        $stats['opens'] = $result->fetch_assoc()['count'];
        
        // Count roof closes
        $result = $this->db->query(
            "SELECT COUNT(*) as count FROM system_logs 
             WHERE type = 'roof' AND action = 'close'"
        );
        $stats['closes'] = $result->fetch_assoc()['count'];
        
        // Count rain events
        $result = $this->db->query(
            "SELECT COUNT(*) as count FROM system_logs 
             WHERE type = 'rain'"
        );
        $stats['rain_events'] = $result->fetch_assoc()['count'];
        
        return $stats;
    }
}

// Function untuk memeriksa ambang batas sensor dan membuat notifikasi
function checkSensorThresholds($data, $notificationSystem) {
    $notifications = [];
    
    // Validasi data yang diperlukan
    if (!isset($data['temperature']) || !isset($data['humidity'])) {
        return $notifications;
    }
    
    // Temperature thresholds
    if ($data['temperature'] > 35) {
        $notificationSystem->addNotification(
            'warning', 
            "🚨 Suhu Tinggi: {$data['temperature']}°C (Batas: 35°C)", 
            $data
        );
        $notifications[] = "Suhu melebihi batas normal: {$data['temperature']}°C";
    } else if ($data['temperature'] < 15) {
        $notificationSystem->addNotification(
            'warning', 
            "❄️ Suhu Rendah: {$data['temperature']}°C (Batas: 15°C)", 
            $data
        );
        $notifications[] = "Suhu di bawah batas normal: {$data['temperature']}°C";
    } else if ($data['temperature'] >= 25 && $data['temperature'] <= 30) {
        $notificationSystem->addNotification(
            'info', 
            "✅ Suhu Optimal: {$data['temperature']}°C", 
            $data
        );
        $notifications[] = "Suhu dalam kondisi optimal";
    }
    
    // Humidity thresholds
    if ($data['humidity'] > 80) {
        $notificationSystem->addNotification(
            'warning', 
            "💧 Kelembapan Tinggi: {$data['humidity']}% (Batas: 80%)", 
            $data
        );
        $notifications[] = "Kelembapan terlalu tinggi: {$data['humidity']}%";
    } else if ($data['humidity'] < 30) {
        $notificationSystem->addNotification(
            'warning', 
            "🏜️ Kelembapan Rendah: {$data['humidity']}% (Batas: 30%)", 
            $data
        );
        $notifications[] = "Kelembapan terlalu rendah: {$data['humidity']}%";
    } else if ($data['humidity'] >= 40 && $data['humidity'] <= 60) {
        $notificationSystem->addNotification(
            'info', 
            "✅ Kelembapan Optimal: {$data['humidity']}%", 
            $data
        );
        $notifications[] = "Kelembapan dalam kondisi optimal";
    }
    
    // Rainfall detection
    if (isset($data['rainfall']) && $data['rainfall'] > 0) {
        $rainLevel = "";
        if ($data['rainfall'] < 5) {
            $rainLevel = "ringan";
        } else if ($data['rainfall'] < 20) {
            $rainLevel = "sedang";
        } else {
            $rainLevel = "lebat";
        }
        
        $notificationSystem->addNotification(
            'info', 
            "🌧️ Hujan {$rainLevel}: {$data['rainfall']}mm", 
            $data
        );
        $notifications[] = "Hujan {$rainLevel} terdeteksi: {$data['rainfall']}mm";
    }
    
    // Light intensity monitoring
    if (isset($data['light_intensity'])) {
        if ($data['light_intensity'] < 100) {
            $notificationSystem->addNotification(
                'warning', 
                "🌑 Cahaya Rendah: {$data['light_intensity']} lux", 
                $data
            );
            $notifications[] = "Intensitas cahaya rendah";
        } else if ($data['light_intensity'] > 10000) {
            $notificationSystem->addNotification(
                'warning', 
                "☀️ Cahaya Tinggi: {$data['light_intensity']} lux", 
                $data
            );
            $notifications[] = "Intensitas cahaya sangat tinggi";
        }
    }
    
    // Distance threshold (for grain level)
    if (isset($data['distance']) && $data['distance'] > 0) {
        if ($data['distance'] > 50) {
            $notificationSystem->addNotification(
                'warning', 
                "📦 Level Gabah Rendah: {$data['distance']}cm", 
                $data
            );
            $notifications[] = "Level gabah perlu ditambah: {$data['distance']}cm";
        } else if ($data['distance'] < 10) {
            $notificationSystem->addNotification(
                'info', 
                "📦 Level Gabah Penuh: {$data['distance']}cm", 
                $data
            );
            $notifications[] = "Level gabah hampir penuh";
        }
    }
    
    // System status notification (first data of the day)
    static $lastDate = null;
    $currentDate = date('Y-m-d');
    if ($lastDate !== $currentDate) {
        $lastDate = $currentDate;
        $notificationSystem->addNotification(
            'info', 
            "🟢 Sistem aktif - " . date('d/m/Y H:i:s'), 
            $data
        );
    }
    
    return $notifications;
}

// Function untuk menangani perubahan status atap
function handleRoofStatusChange($logSystem, $action, $reason = 'manual') {
    $message = "";
    $status = "";
    
    if ($action === 'open') {
        $message = "Atap dibuka " . ($reason === 'manual' ? 'manual oleh operator' : 'otomatis - ' . $reason);
        $status = 'open';
    } else {
        $message = "Atap ditutup " . ($reason === 'manual' ? 'manual oleh operator' : 'otomatis - ' . $reason);
        $status = 'closed';
    }
    
    return $logSystem->addLog('roof', $action, $message, $status);
}

// Function untuk log event hujan
function logRainEvent($logSystem, $intensity, $action = 'detected') {
    $intensityText = "";
    if ($intensity < 5) {
        $intensityText = "ringan";
    } else if ($intensity < 20) {
        $intensityText = "sedang";
    } else {
        $intensityText = "lebat";
    }
    
    $message = "Hujan {$intensityText} terdeteksi: {$intensity}mm";
    return $logSystem->addLog('rain', $action, $message, 'rain');
}

// Function untuk memformat notifikasi agar mudah ditampilkan di frontend
function formatNotificationsForFrontend($notifications) {
    $formatted = [];
    foreach ($notifications as $notif) {
        $formatted[] = [
            'id' => $notif['id'],
            'type' => $notif['type'],
            'message' => $notif['message'],
            'timestamp' => $notif['created_at'],
            'is_read' => (bool)$notif['is_read']
        ];
    }
    return $formatted;
}

// Function untuk membersihkan notifikasi lama (auto-cleanup)
function cleanupOldNotifications($notificationSystem, $days = 7) {
    return $notificationSystem->deleteOldNotifications($days);
}

// Function untuk mengambil notifikasi dengan filter
function getFilteredNotifications($notificationSystem, $filter = 'all', $limit = 50) {
    $filter = strtolower($filter);
    
    switch ($filter) {
        case 'unread':
            return $notificationSystem->getUnreadNotifications($limit);
        case 'warning':
            return $notificationSystem->getNotificationsByType('warning', $limit);
        case 'error':
            return $notificationSystem->getNotificationsByType('error', $limit);
        default:
            return $notificationSystem->getRecentNotifications($limit);
    }
}

// Function untuk menghapus notifikasi berdasarkan ID
function deleteNotification($notificationSystem, $notification_id) {
    $stmt = $notificationSystem->db->prepare(
        "DELETE FROM notifications WHERE id = ?"
    );
    $stmt->bind_param("i", $notification_id);
    $result = $stmt->execute();
    $stmt->close();
    
    return $result;
}

// Function untuk mengambil statistik notifikasi
function getNotificationStats($notificationSystem) {
    $stats = [];
    
    // Total notifications
    $result = $notificationSystem->db->query(
        "SELECT COUNT(*) as total FROM notifications"
    );
    $stats['total'] = $result->fetch_assoc()['total'];
    
    // Unread notifications
    $result = $notificationSystem->db->query(
        "SELECT COUNT(*) as unread FROM notifications WHERE is_read = 0"
    );
    $stats['unread'] = $result->fetch_assoc()['unread'];
    
    // Notifications by type
    $result = $notificationSystem->db->query(
        "SELECT type, COUNT(*) as count FROM notifications GROUP BY type"
    );
    $stats['by_type'] = $result->fetch_all(MYSQLI_ASSOC);
    
    return $stats;
}
?>