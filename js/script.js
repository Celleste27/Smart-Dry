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
        
        this.init();
    }

    init() {
        this.initializeChart();
        this.initWebSocket();
        this.setupEventListeners();
        
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
                break;
            case 'sensor_update':
                this.updateSensorDisplay(data.data);
                this.addChartData(data.data);
                this.showUpdateAnimation();
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
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