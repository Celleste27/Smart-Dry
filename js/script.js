// js/script.js - Enhanced dengan Log Riwayat dan Notifikasi Klik

class SmartDryApp {
    constructor() {
        this.sensorChart = null;
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        
        this.chartData = {
            labels: [],
            temperatures: [],
            lightIntensities: []
        };

        this.notifications = [];
        this.logHistory = [];
        this.unreadCount = 0;
        this.currentPage = 'dashboard';
        this.currentFilter = 'all';
        this.currentLogTab = 'all';
        this.roofStatus = 'closed'; // closed, open, moving
        
        this.init();
    }

    init() {
        this.initializeChart();
        this.initWebSocket();
        this.setupEventListeners();
        this.setupNavigation();
        this.setupControlListeners();
        this.setupFilterListeners();
        this.setupLogTabs();
        this.setupQuickActions();
        this.setupHashNavigation();
        this.setupNotificationClickHandlers();
        this.loadSampleData();
        
        this.updateConnectionStatus(false, 'Connecting...');
        this.handleHashChange();
    }

    setupHashNavigation() {
        // Handle hash changes in URL
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1); // Remove # symbol
        const validPages = ['dashboard', 'notifications', 'control'];
        
        if (validPages.includes(hash)) {
            this.showPage(hash);
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
                if (nav.getAttribute('href') === `#${hash}`) {
                    nav.classList.add('active');
                }
            });
        }
    }

    setupNotificationClickHandlers() {
        // Handle klik pada quick notification badge
        document.addEventListener('click', (e) => {
            // Quick notification badge
            if (e.target.closest('.quick-notification-badge')) {
                this.showPage('notifications');
                return;
            }
            
            // Notification alert
            if (e.target.closest('.notification-alert.clickable')) {
                this.showPage('notifications');
                return;
            }
            
            // Notification item yang bisa diklik
            if (e.target.closest('.notification-item.clickable')) {
                const notificationItem = e.target.closest('.notification-item');
                this.handleNotificationClick(notificationItem);
                return;
            }

            // Notification preview items di dashboard
            if (e.target.closest('.notification-preview-item')) {
                this.showPage('notifications');
                return;
            }
        });
    }

    handleNotificationClick(notificationElement) {
        const notificationId = notificationElement.dataset.id;
        const notification = this.notifications.find(n => n.id === notificationId);
        
        if (notification) {
            // Tandai sebagai sudah dibaca
            if (!notification.isRead) {
                this.markNotificationAsRead(notificationId);
            }
            
            // Pindah ke halaman notifikasi
            this.showPage('notifications');
            
            // Highlight notifikasi yang diklik
            this.highlightNotification(notificationId);
        }
    }

    highlightNotification(notificationId) {
        // Hapus highlight sebelumnya
        document.querySelectorAll('.notification-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Tambahkan highlight ke notifikasi yang diklik
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.add('highlighted');
            
            // Scroll ke notifikasi
            setTimeout(() => {
                notificationElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 500);
            
            // Hapus highlight setelah 3 detik
            setTimeout(() => {
                notificationElement.classList.remove('highlighted');
            }, 3000);
        }
    }

    loadSampleData() {
        // Sample notifications
        this.notifications = [
            {
                id: '1',
                type: 'warning',
                message: '🚨 Suhu Tinggi: 36°C (Batas: 35°C)',
                timestamp: '2025-11-11 20:30:42',
                isRead: false,
                priority: 'high',
                clickable: true
            },
            {
                id: '2',
                type: 'warning',
                message: '💧 Kelembapan Tinggi: 85% (Batas: 80%)',
                timestamp: '2025-11-11 20:30:42',
                isRead: false,
                priority: 'high',
                clickable: true
            },
            {
                id: '3',
                type: 'info',
                message: '🌧️ Hujan sedang: 10mm',
                timestamp: '2025-11-11 20:30:42',
                isRead: true,
                priority: 'medium',
                clickable: true
            },
            {
                id: '4',
                type: 'warning',
                message: '🌑 Cahaya Rendah: 50 lux',
                timestamp: '2025-11-11 20:30:42',
                isRead: false,
                priority: 'medium',
                clickable: true
            },
            {
                id: '5',
                type: 'success',
                message: '🟢 Sistem aktif - 11/11/2025 14:30:42',
                timestamp: '2025-11-11 20:30:42',
                isRead: true,
                priority: 'low',
                clickable: true
            }
        ];

        // Sample log history
        this.logHistory = [
            {
                id: 'log1',
                type: 'roof',
                action: 'open',
                message: 'Atap terbuka otomatis - kondisi cerah',
                timestamp: '2025-11-11 14:25:30',
                status: 'open'
            },
            {
                id: 'log2',
                type: 'roof',
                action: 'close',
                message: 'Atap tertutup otomatis - terdeteksi hujan',
                timestamp: '2025-11-11 15:45:12',
                status: 'closed'
            },
            {
                id: 'log3',
                type: 'system',
                action: 'start',
                message: 'Sistem pengeringan diaktifkan',
                timestamp: '2025-11-11 16:10:05',
                status: 'active'
            },
            {
                id: 'log4',
                type: 'rain',
                action: 'detected',
                message: 'Hujan terdeteksi: 10mm',
                timestamp: '2025-11-11 16:30:42',
                status: 'rain'
            },
            {
                id: 'log5',
                type: 'roof',
                action: 'open',
                message: 'Atap dibuka manual oleh operator',
                timestamp: '2025-11-11 17:15:20',
                status: 'open'
            }
        ];
        
        this.updateNotificationStats();
        this.updateRoofStatus();
        this.updateQuickNotificationBadge();
        this.updateNotificationPreview();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                
                // Add click animation
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = '';
                }, 150);
                
                this.showPage(page);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    showPage(page) {
        // Hide all pages with fade out
        document.querySelectorAll('.page').forEach(p => {
            if (p.classList.contains('active')) {
                p.style.animation = 'slideInUp 0.5s ease reverse';
                setTimeout(() => {
                    p.classList.remove('active');
                    p.style.animation = '';
                }, 250);
            }
        });
        
        // Show selected page with fade in
        setTimeout(() => {
            const targetPage = document.getElementById(`${page}-page`);
            targetPage.classList.add('active');
            
            // Update URL hash
            window.location.hash = page;
            
            // Load page-specific content
            if (page === 'notifications') {
                this.loadNotifications();
                this.applyLogFilter();
                this.updateRoofStatus();
            } else if (page === 'control') {
                this.loadControlPanel();
            } else if (page === 'dashboard') {
                this.updateDashboardStats();
                this.updateNotificationPreview();
            }
        }, 250);
        
        this.currentPage = page;
    }

    setupLogTabs() {
        const logTabs = document.querySelectorAll('.log-tab');
        
        logTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.dataset.filter;
                
                // Update active tab
                logTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                this.currentLogTab = filter;
                this.applyLogFilter();
            });
        });
    }

    applyLogFilter() {
        const logItemsContainer = document.getElementById('log-items');
        let filteredLogs = [...this.logHistory];
        
        switch (this.currentLogTab) {
            case 'roof':
                filteredLogs = filteredLogs.filter(log => log.type === 'roof');
                break;
            case 'system':
                filteredLogs = filteredLogs.filter(log => log.type === 'system');
                break;
            case 'rain':
                filteredLogs = filteredLogs.filter(log => log.type === 'rain');
                break;
            // 'all' shows all logs
        }
        
        this.renderLogHistory(filteredLogs);
    }

    renderLogHistory(logs) {
        const container = document.getElementById('log-items');
        
        if (logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 3em; margin-bottom: 20px;">📝</div>
                    <h3>Tidak ada log</h3>
                    <p>Tidak ada aktivitas yang tercatat.</p>
                </div>
            `;
            return;
        }

        const logsHTML = logs.map(log => `
            <div class="log-item" data-id="${log.id}">
                <div class="log-icon ${log.status}">
                    ${this.getLogIcon(log.type, log.action)}
                </div>
                <div class="log-content">
                    <div class="log-message">${log.message}</div>
                    <div class="log-time">⏰ ${this.formatTime(log.timestamp)}</div>
                </div>
                <div class="log-status ${log.status}">
                    ${this.getStatusText(log.status)}
                </div>
            </div>
        `).join('');

        container.innerHTML = logsHTML;
    }

    getLogIcon(type, action) {
        const icons = {
            'roof': {
                'open': '🔓',
                'close': '🔒',
                'moving': '⚙️'
            },
            'system': {
                'start': '🟢',
                'stop': '🔴',
                'error': '❌'
            },
            'rain': {
                'detected': '🌧️',
                'stopped': '🌤️'
            }
        };
        
        return icons[type]?.[action] || '📝';
    }

    getStatusText(status) {
        const statusTexts = {
            'open': 'Terbuka',
            'closed': 'Tertutup',
            'moving': 'Bergerak',
            'active': 'Aktif',
            'inactive': 'Nonaktif',
            'rain': 'Hujan',
            'clear': 'Cerah'
        };
        
        return statusTexts[status] || status;
    }

    updateRoofStatus() {
        const roofIndicator = document.querySelector('.roof-indicator');
        const roofStatusText = document.querySelector('.roof-status-text');
        const lastAction = this.logHistory.find(log => log.type === 'roof');
        
        if (lastAction) {
            this.roofStatus = lastAction.status;
            roofIndicator.className = `roof-indicator ${this.roofStatus}`;
            roofStatusText.textContent = this.getRoofStatusText(this.roofStatus);
        }
        
        // Update roof stats
        const roofOpens = this.logHistory.filter(log => 
            log.type === 'roof' && log.action === 'open'
        ).length;
        
        const roofCloses = this.logHistory.filter(log => 
            log.type === 'roof' && log.action === 'close'
        ).length;
        
        document.getElementById('roof-opens').textContent = roofOpens;
        document.getElementById('roof-closes').textContent = roofCloses;
        document.getElementById('rain-events').textContent = 
            this.logHistory.filter(log => log.type === 'rain').length;
    }

    getRoofStatusText(status) {
        const statusTexts = {
            'open': 'Atap Terbuka',
            'closed': 'Atap Tertutup',
            'moving': 'Atap Sedang Bergerak'
        };
        
        return statusTexts[status] || 'Status Tidak Diketahui';
    }

    // Method untuk mengontrol atap
    controlRoof(action) {
        this.showToast(`Mengirim perintah: ${action === 'open' ? 'Buka Atap' : 'Tutup Atap'}`, 'info');
        
        // Simulate roof movement
        this.roofStatus = 'moving';
        this.updateRoofStatus();
        
        // Add to log history
        const newLog = {
            id: 'log' + Date.now(),
            type: 'roof',
            action: action,
            message: action === 'open' ? 
                'Atap dibuka manual oleh operator' : 
                'Atap ditutup manual oleh operator',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            status: action
        };
        
        this.logHistory.unshift(newLog);
        this.applyLogFilter();
        this.updateRoofStatus();
        
        // Simulate completion after 3 seconds
        setTimeout(() => {
            this.roofStatus = action;
            this.updateRoofStatus();
            this.showToast(
                action === 'open' ? 'Atap berhasil terbuka' : 'Atap berhasil tertutup', 
                'success'
            );
        }, 3000);
    }

    // Enhanced notification methods dengan priority
    addNotification(message, type = 'info', priority = 'medium', timestamp = null, isRead = false, clickable = true) {
        const notification = {
            id: 'notif' + Date.now(),
            type: type,
            message: message,
            priority: priority,
            timestamp: timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            isRead: isRead,
            clickable: clickable
        };
        
        this.notifications.unshift(notification);
        this.applyNotificationFilter();
        this.updateNotificationStats();
        
        // Show notification alert
        if (!isRead) {
            this.showNotificationAlert(message, type, clickable);
        }
        
        // Update quick notification badge
        this.updateQuickNotificationBadge();
        
        // Update notification preview di dashboard
        this.updateNotificationPreview();
    }

    // Enhanced notification rendering dengan priority
    renderFilteredNotifications(notifications) {
        const container = document.getElementById('notifications-list-full');
        
        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4em; margin-bottom: 20px;">🔍</div>
                    <h3>Tidak ada notifikasi</h3>
                    <p>Tidak ditemukan notifikasi dengan filter yang dipilih.</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = notifications.map(notif => `
            <div class="notification-item ${notif.type} ${notif.isRead ? 'read' : 'unread'} ${notif.clickable ? 'clickable' : ''}" 
                 data-id="${notif.id}">
                <div class="notification-content">
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-priority">
                        <span class="priority-badge priority-${notif.priority}">
                            ${this.getPriorityText(notif.priority)}
                        </span>
                    </div>
                    <div class="notification-time">⏰ ${this.formatTime(notif.timestamp)}</div>
                </div>
                <div class="notification-actions-small">
                    ${!notif.isRead ? 
                        `<button class="mark-read-btn" onclick="event.stopPropagation(); smartDryApp.markNotificationAsRead('${notif.id}')">
                            ✓ Tandai Baca
                         </button>` : ''
                    }
                    <button class="remove-btn" onclick="event.stopPropagation(); smartDryApp.deleteNotification('${notif.id}')">
                        🗑️ Hapus
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = notificationsHTML;
    }

    getPriorityText(priority) {
        const priorityTexts = {
            'high': 'Tinggi',
            'medium': 'Sedang',
            'low': 'Rendah'
        };
        
        return priorityTexts[priority] || priority;
    }

    // Update method showNotificationAlert untuk yang bisa diklik
    showNotificationAlert(message, type = 'info', clickable = true) {
        const alert = document.createElement('div');
        alert.className = `notification-alert ${type} ${clickable ? 'clickable' : ''}`;
        alert.innerHTML = `
            <div class="alert-content">
                <strong>${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'} Notifikasi Baru</strong>
                <div>${message}</div>
                ${clickable ? '<div class="alert-hint">Klik untuk melihat detail →</div>' : ''}
            </div>
        `;
        
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getAlertColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${this.getBorderColor(type)};
            cursor: ${clickable ? 'pointer' : 'default'};
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    getAlertColor(type) {
        const colors = {
            'warning': '#e74c3c',
            'error': '#c0392b',
            'success': '#27ae60',
            'info': '#3498db'
        };
        return colors[type] || '#3498db';
    }

    getBorderColor(type) {
        const colors = {
            'warning': '#ff6b6b',
            'error': '#ff4757',
            'success': '#2ed573',
            'info': '#3742fa'
        };
        return colors[type] || '#3742fa';
    }

    // Method untuk update quick notification badge
    updateQuickNotificationBadge() {
        let badge = document.getElementById('quick-notification-badge');
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        if (unreadCount > 0 && !badge) {
            badge = document.createElement('div');
            badge.id = 'quick-notification-badge';
            badge.className = 'quick-notification-badge';
            badge.innerHTML = `
                🔔
                <div class="badge-count">${unreadCount}</div>
            `;
            document.body.appendChild(badge);
        } else if (badge && unreadCount > 0) {
            const badgeCount = badge.querySelector('.badge-count');
            badgeCount.textContent = unreadCount;
        } else if (badge && unreadCount === 0) {
            badge.remove();
        }
    }

    // Update notification preview di dashboard
    updateNotificationPreview() {
        const previewContainer = document.getElementById('notification-preview-list');
        if (!previewContainer) return;

        const recentNotifications = this.notifications.slice(0, 3); // Ambil 3 notifikasi terbaru
        
        if (recentNotifications.length === 0) {
            previewContainer.innerHTML = '<p class="no-notifications">Tidak ada notifikasi</p>';
            return;
        }

        const previewHTML = recentNotifications.map(notif => `
            <div class="notification-preview-item ${notif.type}" data-id="${notif.id}">
                <div class="preview-message">${notif.message}</div>
                <div class="preview-time">${this.formatTime(notif.timestamp)}</div>
            </div>
        `).join('');

        previewContainer.innerHTML = previewHTML;
    }

    // Quick actions untuk notifikasi page
    setupQuickActions() {
        document.getElementById('open-roof-btn').addEventListener('click', () => {
            this.controlRoof('open');
        });
        
        document.getElementById('close-roof-btn').addEventListener('click', () => {
            this.controlRoof('close');
        });
        
        document.getElementById('test-notification-btn').addEventListener('click', () => {
            this.addNotification(
                '🧪 Notifikasi percobaan - Sistem berfungsi normal',
                'info',
                'low',
                null,
                false,
                true
            );
        });
    }

    setupFilterListeners() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                
                // Update active filter
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentFilter = filter;
                this.applyNotificationFilter();
            });
        });
    }

    applyNotificationFilter() {
        let filteredNotifications = [...this.notifications];
        
        switch (this.currentFilter) {
            case 'unread':
                filteredNotifications = filteredNotifications.filter(n => !n.isRead);
                break;
            case 'warning':
                filteredNotifications = filteredNotifications.filter(n => n.type === 'warning');
                break;
            case 'error':
                filteredNotifications = filteredNotifications.filter(n => n.type === 'error');
                break;
            // 'all' shows all notifications
        }
        
        this.renderFilteredNotifications(filteredNotifications);
    }

    loadNotifications() {
        const notificationsList = document.getElementById('notifications-list-full');
        notificationsList.innerHTML = '<div class="loading">Memuat notifikasi...</div>';
        
        // Simulate API delay
        setTimeout(() => {
            this.applyNotificationFilter();
        }, 800);
    }

    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            this.applyNotificationFilter();
            this.updateNotificationStats();
            this.updateQuickNotificationBadge();
            this.updateNotificationPreview();
            this.showToast('Notifikasi ditandai sudah dibaca', 'success');
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notif => notif.isRead = true);
        this.applyNotificationFilter();
        this.updateNotificationStats();
        this.updateQuickNotificationBadge();
        this.updateNotificationPreview();
        this.showToast('Semua notifikasi ditandai sudah dibaca', 'success');
    }

    deleteNotification(notificationId) {
        const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.style.animation = 'slideInUp 0.3s ease reverse';
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== notificationId);
                this.applyNotificationFilter();
                this.updateNotificationStats();
                this.updateQuickNotificationBadge();
                this.updateNotificationPreview();
                this.showToast('Notifikasi dihapus', 'success');
            }, 300);
        }
    }

    clearAllNotifications() {
        if (confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) {
            this.notifications = [];
            this.applyNotificationFilter();
            this.updateNotificationStats();
            this.updateQuickNotificationBadge();
            this.updateNotificationPreview();
            this.showToast('Semua notifikasi dihapus', 'success');
        }
    }

    updateNotificationStats() {
        const totalCount = this.notifications.length;
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        document.getElementById('total-notifications').textContent = totalCount;
        document.getElementById('unread-notifications').textContent = unreadCount;
        
        this.unreadCount = unreadCount;
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
            
            // Add bounce animation when count changes
            if (this.unreadCount > 0) {
                badge.style.animation = 'bounce 0.5s ease';
                setTimeout(() => badge.style.animation = '', 500);
            }
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    updateDashboardStats() {
        // Update quick stats
        document.getElementById('active-notifications').textContent = 
            this.notifications.filter(n => !n.isRead).length;
        document.getElementById('avg-temperature').textContent = '36°C';
        document.getElementById('system-status').textContent = 'Aktif';
        document.getElementById('system-uptime').textContent = '99.8%';
    }

    loadControlPanel() {
        // Initialize control panel with current values
        this.updateControlPanel();
    }

    updateControlPanel() {
        // Update control values based on current sensor data
        const currentData = this.getCurrentSensorData();
        
        // Update temperature control
        document.getElementById('temperature-value').textContent = 
            `${currentData.temperature}°C`;
        document.getElementById('temperature-slider').value = currentData.temperature;
        
        // Update humidity control
        document.getElementById('humidity-value').textContent = 
            `${currentData.humidity}%`;
        document.getElementById('humidity-slider').value = currentData.humidity;
        
        // Update light control
        document.getElementById('light-value-control').textContent = 
            `${currentData.light_intensity} lux`;
        document.getElementById('light-slider').value = currentData.light_intensity;
    }

    getCurrentSensorData() {
        // Return current sensor data (in real app, this would come from WebSocket)
        return {
            temperature: 36,
            humidity: 85,
            light_intensity: 50,
            rainfall: 10,
            distance: 55
        };
    }

    setupControlListeners() {
        // Temperature control
        const tempSlider = document.getElementById('temperature-slider');
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('temperature-value').textContent = `${value}°C`;
            });
        }

        // Humidity control
        const humiditySlider = document.getElementById('humidity-slider');
        if (humiditySlider) {
            humiditySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('humidity-value').textContent = `${value}%`;
            });
        }

        // Light control
        const lightSlider = document.getElementById('light-slider');
        if (lightSlider) {
            lightSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('light-value-control').textContent = `${value} lux`;
            });
        }

        // Toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                const controlName = e.target.id.replace('-toggle', '');
                const isEnabled = e.target.checked;
                
                this.showToast(
                    `${this.getControlLabel(controlName)} ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}`,
                    isEnabled ? 'success' : 'info'
                );
            });
        });
    }

    getControlLabel(controlName) {
        const labels = {
            'system': 'Sistem',
            'heater': 'Pemanas',
            'ventilation': 'Ventilasi',
            'lighting': 'Pencahayaan',
            'drying': 'Pengeringan',
            'emergency': 'Mode Darurat'
        };
        return labels[controlName] || controlName;
    }

    initializeChart() {
        const ctx = document.getElementById('sensorChart');
        if (!ctx) return;

        this.sensorChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: this.chartData.labels,
                datasets: [
                    {
                        label: 'Suhu (°C)',
                        data: this.chartData.temperatures,
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Cahaya (lux)',
                        data: this.chartData.lightIntensities,
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    }
                }
            }
        });
    }

    initWebSocket() {
        // WebSocket implementation would go here
        console.log('WebSocket initialization placeholder');
        this.updateConnectionStatus(true, 'Connected');
    }

    updateConnectionStatus(connected, message) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statusDot && statusText) {
            if (connected) {
                statusDot.classList.add('connected');
                statusText.textContent = message;
                statusText.style.color = '#00C851';
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = message;
                statusText.style.color = '#ff4444';
            }
        }
    }

    setupEventListeners() {
        // Additional event listeners can be added here
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.smartDryApp = new SmartDryApp();
});

// Add bounce animation for badge
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
        40% {transform: translateY(-5px);}
        60% {transform: translateY(-3px);}
    }
`;
document.head.appendChild(style);