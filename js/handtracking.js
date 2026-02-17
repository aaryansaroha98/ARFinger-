/**
 * ARFinger - Hand Tracking Module
 * Handles MediaPipe Hands integration and finger detection
 */

class HandTracker {
    constructor(options = {}) {
        this.onResults = options.onResults || (() => {});
        this.onLoad = options.onLoad || (() => {});
        this.onError = options.onError || ((err) => console.error(err));
        
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
    }

    /**
     * Initialize MediaPipe Hands
     */
    async initialize() {
        try {
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => {
                this.onResults(results);
            });

            await this.hands.initialize();
            this.isInitialized = true;
            this.onLoad();
            
        } catch (error) {
            this.onError(error);
        }
    }

    /**
     * Start camera feed
     */
    async startCamera(videoElement) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.camera.start();
            return true;
        } catch (error) {
            this.onError(error);
            return false;
        }
    }

    /**
     * Stop camera
     */
    stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
    }

    /**
     * Get finger states from hand landmarks
     * Returns array of [index, middle, ring, pinky] extended states
     */
    getFingerStates(landmarks) {
        const fingers = [];
        
        // Index finger: landmarks 8 (tip) and 7 (PIP)
        const indexTip = landmarks[8];
        const indexPip = landmarks[7];
        fingers.push(indexTip.y < indexPip.y);
        
        // Middle finger: landmarks 12 (tip) and 11 (PIP)
        const middleTip = landmarks[12];
        const middlePip = landmarks[11];
        fingers.push(middleTip.y < middlePip.y);
        
        // Ring finger: landmarks 16 (tip) and 15 (PIP)
        const ringTip = landmarks[16];
        const ringPip = landmarks[15];
        fingers.push(ringTip.y < ringPip.y);
        
        // Pinky finger: landmarks 20 (tip) and 19 (PIP)
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[19];
        fingers.push(pinkyTip.y < pinkyPip.y);
        
        return fingers;
    }

    /**
     * Detect gesture based on finger states
     */
    detectGesture(fingerStates) {
        const fingersExtended = fingerStates.filter(Boolean).length;
        
        // Draw: Only index finger extended
        if (fingersExtended === 1 && fingerStates[0]) {
            return "draw";
        }
        // Erase: All 4 fingers extended
        else if (fingersExtended >= 4) {
            return "erase";
        }
        else {
            return "idle";
        }
    }

    /**
     * Get index finger tip position
     */
    getIndexTipPosition(landmarks, width, height) {
        const tip = landmarks[8];
        return {
            x: Math.floor(tip.x * width),
            y: Math.floor(tip.y * height)
        };
    }

    /**
     * Get palm center position (for erasing)
     */
    getPalmCenter(landmarks, width, height) {
        const palm = landmarks[9];
        return {
            x: Math.floor(palm.x * width),
            y: Math.floor(palm.y * height)
        };
    }
}

window.HandTracker = HandTracker;
