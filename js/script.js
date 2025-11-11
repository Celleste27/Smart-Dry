// js/script.js
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
        this.unreadCount = 0;
        
        this.init();
    }

    init() {
        this.initializeChart();
        this.initWebSocket();
        this.setupEventListeners();
        this.setupNotifications();
        
        // Display initial connection status
        this.updateConnectionStatus(false, 'Connecting...');
    }

    initializeChart() {
        const ctx = document.getElementById('sensorChart').getContext('2d');
        this.sensorChart = new Chart(ctx, {
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
        // Determine WebSocket URL based on current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = '8080'; // WebSocket server port
        const wsUrl = `${protocol}//${host}:${port}`;
        
        console.log('Attempting to connect to:', wsUrl);
        
        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = (event) => {
                console.log('WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true, 'Connected');
                
                // Request initial data
                this.requestInitialData();
            };
            
            this.websocket.onmessage = (event) => {
                console.log('Received WebSocket message:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.websocket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.updateConnectionStatus(false, 'Disconnected');
                
                if (event.code !== 1000) { // Not a normal closure
                    this.attemptReconnect();
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                this.updateConnectionStatus(false, 'Connection Error');
            };
            
        } catch (error) {
            console.error('WebSocket initialization error:', error);
            this.updateConnectionStatus(false, 'Connection Failed');
            this.attemptReconnect();
        }
    }

    setupNotifications() {
        const notificationsTab = document.getElementById('notifications-tab');
        const clearButton = document.getElementById('clear-notifications');
        const markAllReadButton = document.getElementById('mark-all-read');
        const notificationsPanel = document.getElementById('notifications-panel');

        // Toggle notifications panel
        notificationsTab.addEventListener('click', (e) => {
            e.preventDefault();
            notificationsPanel.classList.toggle('show');
            this.updateNotificationsTabState();
        });

        // Clear all notifications
        clearButton.addEventListener('click', () => {
            this.clearNotifications();
        });

        // Mark all as read
        markAllReadButton.addEventListener('click', () => {
            this.markAllNotificationsAsRead();
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationsPanel.contains(e.target) && !notificationsTab.contains(e.target)) {
                notificationsPanel.classList.remove('show');
            }
        });
    }

    updateNotificationsTabState() {
        const notificationsTab = document.getElementById('notifications-tab');
        const notificationsPanel = document.getElementById('notifications-panel');
        
        if (notificationsPanel.classList.contains('show')) {
            notificationsTab.classList.add('active');
        } else {
            notificationsTab.classList.remove('active');
        }
    }

    addNotification(message, type = 'info', timestamp = null, isRead = false) {
        const notificationsList = document.getElementById('notifications-list');
        const placeholder = notificationsList.querySelector('.notification-placeholder');
        
        // Remove placeholder if it exists
        if (placeholder) {
            placeholder.remove();
        }

        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${type}`;
        
        const time = timestamp || new Date().toLocaleTimeString('id-ID');
        const displayTime = typeof timestamp === 'string' ? timestamp : time;
        
        notificationItem.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <div class="notification-meta">
                <span class="notification-time">${displayTime}</span>
                <div class="notification-actions-small">
                    ${!isRead ? '<button class="mark-read-btn">Tandai Baca</button>' : ''}
                    <button class="remove-btn">Hapus</button>
                </div>
            </div>
        `;

        // Add event listeners for buttons
        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
        const removeBtn = notificationItem.querySelector('.remove-btn');

        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                this.markNotificationAsRead(notificationItem);
            });
        }

        removeBtn.addEventListener('click', () => {
            notificationItem.remove();
            this.updateNotificationCount();
            this.showEmptyStateIfNeeded();
        });

        // Add to top
        notificationsList.insertBefore(notificationItem, notificationsList.firstChild);

        // Limit to 15 notifications
        if (notificationsList.children.length > 15) {
            notificationsList.removeChild(notificationsList.lastChild);
        }

        // Update counter if not read
        if (!isRead) {
            this.unreadCount++;
            this.updateNotificationBadge();
        }

        // Show notification alert for new notifications
        if (!isRead) {
            this.showNotificationAlert(message, type);
        }

        // Update notification count display
        this.updateNotificationCount();
    }

    showNotificationAlert(message, type) {
        // Create temporary alert
        const alert = document.createElement('div');
        alert.className = `notification-alert ${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <strong>${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'} Notifikasi Baru</strong>
                <div>${message}</div>
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
        `;

        document.body.appendChild(alert);

        // Remove after 5 seconds
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 300);
        }, 5000);

        // Add CSS animations if not already added
        this.addAlertAnimations();
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

    addAlertAnimations() {
        if (!document.getElementById('alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    markNotificationAsRead(notificationElement) {
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.remove();
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateNotificationBadge();
        }
    }

    markAllNotificationsAsRead() {
        const markReadButtons = document.querySelectorAll('.mark-read-btn');
        markReadButtons.forEach(btn => btn.remove());
        this.unreadCount = 0;
        this.updateNotificationBadge();
    }

    clearNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '<div class="notification-placeholder"><p>Tidak ada notifikasi</p></div>';
        this.unreadCount = 0;
        this.updateNotificationBadge();
        this.updateNotificationCount();
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        badge.textContent = this.unreadCount;
        badge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
    }

    updateNotificationCount() {
        const notificationsList = document.getElementById('notifications-list');
        const countElement = document.getElementById('notification-count');
        const itemCount = notificationsList.querySelectorAll('.notification-item').length;
        
        countElement.textContent = `${itemCount} notifikasi`;
        document.getElementById('notif-update-time').textContent = new Date().toLocaleTimeString('id-ID');
    }

    showEmptyStateIfNeeded() {
        const notificationsList = document.getElementById('notifications-list');
        if (notificationsList.children.length === 0) {
            notificationsList.innerHTML = '<div class="notification-placeholder"><p>Tidak ada notifikasi</p></div>';
        }
    }

    updateConnectionStatus(connected, message) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
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

    requestInitialData() {
        // You can send a request for initial data if needed
        const request = {
            type: 'request_initial_data'
        };
        
        if (this.websocket && this.isConnected) {
            this.websocket.send(JSON.stringify(request));
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'initial_data':
                this.updateSensorDisplay(data.latest_data);
                this.updateChartWithHistory(data.chart_data);
                if (data.notifications) {
                    this.handleInitialNotifications(data.notifications);
                }
                break;
            case 'sensor_update':
                this.updateSensorDisplay(data.data);
                this.addChartData(data.data);
                this.showUpdateAnimation();
                break;
            case 'notifications':
                this.handleNewNotifications(data.notifications);
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    handleInitialNotifications(notifications) {
        notifications.forEach(notif => {
            this.addNotification(
                notif.message,
                notif.type,
                new Date(notif.created_at).toLocaleString('id-ID'),
                notif.is_read
            );
        });
    }

    handleNewNotifications(notifications) {
        notifications.forEach(notification => {
            this.addNotification(notification, 'warning');
        });
    }

    updateSensorDisplay(data) {
        this.updateValueWithAnimation('rainfall-value', 
            (parseFloat(data.rainfall) || 0).toFixed(1) + ' <span class="sensor-unit">mm</span>');

        
        this.updateValueWithAnimation('light-value', 
            (parseFloat(data.light_intensity) || 0).toFixed(0) + ' <span class="sensor-unit">lux</span>');
        
        this.updateValueWithAnimation('temp-humid-value', 
            (parseFloat(data.temperature) || 0).toFixed(1) + '°C ' + (parseFloat(data.humidity) || 0).toFixed(1) + '%');
        
        this.updateValueWithAnimation('distance-value', 
            (parseFloat(data.distance) || 0).toFixed(1) + ' <span class="sensor-unit">cm</span>');
        
        document.getElementById('update-time').textContent = new Date().toLocaleString('id-ID');
    }

    updateValueWithAnimation(elementId, newValue) {
        const element = document.getElementById(elementId);
        
        // Add update animation
        element.style.transform = 'scale(1.1)';
        element.style.color = '#ff4444';
        element.innerHTML = newValue;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.color = '#4CAF50';
        }, 300);
    }

    showUpdateAnimation() {
        const cards = document.querySelectorAll('.sensor-card');
        cards.forEach(card => {
            card.classList.add('updated');
            setTimeout(() => {
                card.classList.remove('updated');
            }, 1000);
        });
    }

    updateChartWithHistory(chartData) {
        if (!this.sensorChart) return;
        
        this.chartData.labels = chartData.map(item => 
            new Date(item.created_at).toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );
        this.chartData.temperatures = chartData.map(item => item.temperature || 0);
        this.chartData.lightIntensities = chartData.map(item => item.light_intensity || 0);
        
        this.sensorChart.data.labels = this.chartData.labels;
        this.sensorChart.data.datasets[0].data = this.chartData.temperatures;
        this.sensorChart.data.datasets[1].data = this.chartData.lightIntensities;
        this.sensorChart.update('none');
    }

    addChartData(newData) {
        if (!this.sensorChart) return;
        
        const now = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Add new data
        this.chartData.labels.push(now);
        this.chartData.temperatures.push(newData.temperature || 0);
        this.chartData.lightIntensities.push(newData.light_intensity || 0);
        
        // Keep only last 20 data points
        const maxDataPoints = 20;
        if (this.chartData.labels.length > maxDataPoints) {
            this.chartData.labels.shift();
            this.chartData.temperatures.shift();
            this.chartData.lightIntensities.shift();
        }
        
        // Update chart
        this.sensorChart.data.labels = this.chartData.labels;
        this.sensorChart.data.datasets[0].data = this.chartData.temperatures;
        this.sensorChart.data.datasets[1].data = this.chartData.lightIntensities;
        this.sensorChart.update('none');
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            this.updateConnectionStatus(false, 'Connection Failed');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectInterval * this.reconnectAttempts;
        
        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        this.updateConnectionStatus(false, `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.initWebSocket();
        }, delay);
    }

    setupEventListeners() {
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.isConnected) {
                console.log('Page became visible, attempting reconnect...');
                this.initWebSocket();
            }
        });

        // Manual reconnect button (optional)
        this.addManualReconnect();
    }

    addManualReconnect() {
        // Add a manual reconnect button to the status area
        const statusElement = document.querySelector('.connection-status');
        statusElement.style.cursor = 'pointer';
        statusElement.title = 'Click to reconnect';
        
        statusElement.addEventListener('click', () => {
            if (!this.isConnected) {
                console.log('Manual reconnect triggered');
                this.reconnectAttempts = 0;
                this.initWebSocket();
            }
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.smartDryApp = new SmartDryApp();
});