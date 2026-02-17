/**
 * ARFinger - Main Application
 * Handles drawing canvas and UI interactions
 */

class ARFingerApp {
    constructor() {
        // Canvas settings
        this.drawingCanvas = null;
        this.drawingCtx = null;
        this.overlayCanvas = null;
        this.overlayCtx = null;
        this.prevPoint = null;
        
        // Drawing settings
        this.brushThickness = 10;
        this.brushColor = '#4CAF50';
        this.eraseRadius = 45;
        
        // State
        this.currentMode = 'idle';
        this.fingerStates = [];
        
        // DOM elements
        this.videoElement = null;
        this.modeIndicator = null;
        this.loadingElement = null;
        
        // Hand tracker
        this.handTracker = null;
        
        // Canvas dimensions
        this.width = 0;
        this.height = 0;
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupDOM();
        this.setupCanvas();
        this.setupHandTracker();
        this.setupEventListeners();
        
        // Start camera
        await this.startCamera();
    }

    /**
     * Setup DOM element references
     */
    setupDOM() {
        this.videoElement = document.getElementById('input-video');
        this.drawingCanvas = document.getElementById('drawing-canvas');
        this.overlayCanvas = document.getElementById('overlay-canvas');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.loadingElement = document.getElementById('loading');
    }

    /**
     * Setup drawing canvas
     */
    setupCanvas() {
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        
        // Set canvas size to match container
        const container = this.drawingCanvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.drawingCanvas.width = this.width;
        this.drawingCanvas.height = this.height;
        this.overlayCanvas.width = this.width;
        this.overlayCanvas.height = this.height;
        
        // Clear canvases
        this.drawingCtx.clearRect(0, 0, this.width, this.height);
        this.overlayCtx.clearRect(0, 0, this.width, this.height);
        
        this.prevPoint = null;
    }

    /**
     * Setup hand tracking
     */
    setupHandTracker() {
        this.handTracker = new HandTracker({
            onLoad: () => {
                console.log('Hand tracking model loaded');
                this.hideLoading();
            },
            onError: (error) => {
                console.error('Hand tracking error:', error);
                this.showError('Failed to load hand tracking model');
            },
            onResults: (results) => {
                this.processResults(results);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });

        // Restart camera button
        document.getElementById('camera-btn').addEventListener('click', () => {
            this.restartCamera();
        });

        // Thickness slider
        document.getElementById('thickness-slider').addEventListener('input', (e) => {
            this.brushThickness = parseInt(e.target.value);
            document.getElementById('thickness-value').textContent = this.brushThickness;
        });

        // Color picker
        document.getElementById('color-picker').addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Start camera and hand tracking
     */
    async startCamera() {
        this.showLoading();
        
        try {
            await this.handTracker.initialize();
            await this.handTracker.startCamera(this.videoElement);
        } catch (error) {
            console.error('Camera error:', error);
            this.showError('Could not access camera. Please grant camera permission.');
        }
    }

    /**
     * Restart camera
     */
    async restartCamera() {
        this.handTracker.stopCamera();
        this.clearCanvas();
        await this.startCamera();
    }

    /**
     * Process hand tracking results
     */
    processResults(results) {
        // Clear overlay canvas (not the persistent drawing canvas)
        this.overlayCtx.clearRect(0, 0, this.width, this.height);
        
        let currentPoint = null;
        let gesture = 'idle';
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Get finger states
            this.fingerStates = this.handTracker.getFingerStates(landmarks);
            
            // Detect gesture
            gesture = this.handTracker.detectGesture(this.fingerStates);
            
            if (gesture === 'erase') {
                // Use palm center for erasing
                currentPoint = this.handTracker.getPalmCenter(landmarks, this.width, this.height);
                
                // Draw eraser circle on overlay canvas
                this.overlayCtx.beginPath();
                this.overlayCtx.arc(currentPoint.x, currentPoint.y, this.eraseRadius, 0, Math.PI * 2);
                this.overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.overlayCtx.fill();
                this.overlayCtx.strokeStyle = '#f44336';
                this.overlayCtx.lineWidth = 3;
                this.overlayCtx.stroke();
                
            } else if (gesture === 'draw') {
                // Use index finger tip for drawing
                currentPoint = this.handTracker.getIndexTipPosition(landmarks, this.width, this.height);
                
                // Draw finger indicator on overlay with current brush color
                this.overlayCtx.beginPath();
                this.overlayCtx.arc(currentPoint.x, currentPoint.y, 10, 0, Math.PI * 2);
                this.overlayCtx.fillStyle = this.brushColor;
                this.overlayCtx.fill();
            }
            
            // Update mode
            this.currentMode = gesture;
            this.updateModeIndicator(gesture);
            
            // Draw or erase on persistent drawing canvas
            if (currentPoint) {
                this.draw(currentPoint, gesture);
            } else {
                this.prevPoint = null;
            }
            
            // Draw hand landmarks on overlay canvas
            this.drawHandLandmarks(results.multiHandLandmarks[0]);
            
        } else {
            // No hand detected
            this.currentMode = 'idle';
            this.updateModeIndicator('idle');
            this.prevPoint = null;
        }
    }

    /**
     * Draw hand landmarks on overlay canvas
     */
    drawHandLandmarks(landmarks) {
        // Draw connections
        this.overlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.overlayCtx.lineWidth = 2;
        
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
        ];
        
        this.overlayCtx.beginPath();
        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            this.overlayCtx.moveTo(p1.x * this.width, p1.y * this.height);
            this.overlayCtx.lineTo(p2.x * this.width, p2.y * this.height);
        });
        this.overlayCtx.stroke();
        
        // Draw points
        landmarks.forEach((landmark) => {
            const x = landmark.x * this.width;
            const y = landmark.y * this.height;
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(x, y, 4, 0, Math.PI * 2);
            this.overlayCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.overlayCtx.fill();
        });
    }

    /**
     * Draw on persistent drawing canvas based on gesture
     */
    draw(point, gesture) {
        if (gesture === 'draw' && this.prevPoint) {
            // Draw line with custom color
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(this.prevPoint.x, this.prevPoint.y);
            this.drawingCtx.lineTo(point.x, point.y);
            this.drawingCtx.strokeStyle = this.brushColor;
            this.drawingCtx.lineWidth = this.brushThickness;
            this.drawingCtx.lineCap = 'round';
            this.drawingCtx.lineJoin = 'round';
            // Add shadow for smoother appearance
            this.drawingCtx.shadowBlur = 2;
            this.drawingCtx.shadowColor = this.brushColor;
            this.drawingCtx.stroke();
            this.drawingCtx.shadowBlur = 0;
            
        } else if (gesture === 'erase' && this.prevPoint) {
            // Erase using composite operation to make pixels transparent
            this.drawingCtx.save();
            this.drawingCtx.globalCompositeOperation = 'destination-out';
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(this.prevPoint.x, this.prevPoint.y);
            this.drawingCtx.lineTo(point.x, point.y);
            this.drawingCtx.lineWidth = this.eraseRadius * 2;
            this.drawingCtx.lineCap = 'round';
            this.drawingCtx.lineJoin = 'round';
            this.drawingCtx.stroke();
            this.drawingCtx.restore();
        }
        
        this.prevPoint = point;
    }

    /**
     * Clear the drawing canvas
     */
    clearCanvas() {
        this.drawingCtx.clearRect(0, 0, this.width, this.height);
        this.prevPoint = null;
    }

    /**
     * Update mode indicator
     */
    updateModeIndicator(mode) {
        const indicator = this.modeIndicator;
        
        indicator.className = 'mode-indicator ' + mode;
        
        switch(mode) {
            case 'draw':
                indicator.textContent = '✏️ Drawing Mode';
                break;
            case 'erase':
                indicator.textContent = '🧹 Erase Mode';
                break;
            case 'idle':
                indicator.textContent = '👋 Show hand to start';
                break;
            default:
                indicator.textContent = 'Initializing...';
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.loadingElement.classList.remove('hidden');
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingElement.classList.add('hidden');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideLoading();
        
        const container = document.querySelector('.video-container');
        const existingError = container.querySelector('.camera-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'camera-error';
        errorDiv.innerHTML = `
            <h3>⚠️ Error</h3>
            <p>${message}</p>
        `;
        container.appendChild(errorDiv);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const container = this.drawingCanvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.drawingCanvas.width = this.width;
        this.drawingCanvas.height = this.height;
        this.overlayCanvas.width = this.width;
        this.overlayCanvas.height = this.height;
        
        this.prevPoint = null;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ARFingerApp();
    app.init();
});
