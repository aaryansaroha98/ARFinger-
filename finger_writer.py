"""
AR Finger Writing System
Allows you to write in the air using your index finger and erase with full hand gestures.
"""

import cv2
import mediapipe as mp
import numpy as np


class FingerWriter:
    def __init__(self):
        # Initialize MediaPipe hand detection
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils
        
        # Drawing settings
        self.canvas = None
        self.prev_point = None
        self.brush_thickness = 10
        self.erase_radius = 100
        
        # Gesture state
        self.finger_states = []
        
    def get_finger_states(self, hand_landmarks):
        """Determine which fingers are extended"""
        fingers = []
        
        # Index finger (landmark 8)
        index_tip = hand_landmarks.landmark[8]
        index_pip = hand_landmarks.landmark[7]
        fingers.append(index_tip.y < index_pip.y)
        
        # Middle finger (landmark 12)
        middle_tip = hand_landmarks.landmark[12]
        middle_pip = hand_landmarks.landmark[11]
        fingers.append(middle_tip.y < middle_pip.y)
        
        # Ring finger (landmark 16)
        ring_tip = hand_landmarks.landmark[16]
        ring_pip = hand_landmarks.landmark[15]
        fingers.append(ring_tip.y < ring_pip.y)
        
        # Pinky finger (landmark 20)
        pinky_tip = hand_landmarks.landmark[20]
        pinky_pip = hand_landmarks.landmark[19]
        fingers.append(pinky_tip.y < pinky_pip.y)
        
        return fingers
    
    def detect_gesture(self, finger_states):
        """Detect the current gesture based on finger states"""
        fingers_extended = sum(finger_states)
        
        # Drawing: Only index finger extended (1 finger)
        # Erasing: All 4 fingers extended (full hand open)
        
        if fingers_extended == 1 and finger_states[0]:
            return "draw"
        elif fingers_extended >= 4:  # All 4 fingers = erase mode
            return "erase"
        else:
            return "idle"
    
    def draw_on_canvas(self, point, gesture):
        """Draw or erase on the canvas based on gesture"""
        if self.canvas is None:
            return
            
        if gesture == "draw" and point is not None:
            if self.prev_point is not None:
                cv2.line(self.canvas, self.prev_point, point, (0, 255, 0), self.brush_thickness)
            self.prev_point = point
            
        elif gesture == "erase" and point is not None:
            # Erase with continuous trail
            if self.prev_point is not None:
                cv2.line(self.canvas, self.prev_point, point, (0, 0, 0), self.erase_radius)
            else:
                cv2.circle(self.canvas, point, self.erase_radius, (0, 0, 0), -1)
            self.prev_point = point
            
        else:
            self.prev_point = None
    
    def get_palm_center(self, hand_landmarks, w, h):
        """Get the center of the palm using landmark 9 (middle finger MCP)"""
        palm_x = int(hand_landmarks.landmark[9].x * w)
        palm_y = int(hand_landmarks.landmark[9].y * h)
        return (palm_x, palm_y)
    
    def process_frame(self, frame):
        """Process a single frame and return the result"""
        frame = cv2.flip(frame, 1)
        
        if self.canvas is None:
            self.canvas = np.zeros_like(frame)
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        current_gesture = "idle"
        current_point = None
        h, w, c = frame.shape
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.finger_states = self.get_finger_states(hand_landmarks)
                current_gesture = self.detect_gesture(self.finger_states)
                
                if current_gesture == "erase":
                    # Use palm center for erasing (landmark 9 = middle finger MCP)
                    current_point = self.get_palm_center(hand_landmarks, w, h)
                    
                    # Draw a circle on the palm to show eraser
                    cv2.circle(frame, current_point, self.erase_radius, (0, 0, 255), 3)
                    cv2.circle(frame, current_point, 10, (0, 0, 255), -1)
                else:
                    # Use index finger tip for drawing (landmark 8)
                    index_tip_x = int(hand_landmarks.landmark[8].x * w)
                    index_tip_y = int(hand_landmarks.landmark[8].y * h)
                    current_point = (index_tip_x, index_tip_y)
                
                # Draw hand landmarks
                self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                
                # Draw indicator
                color = (0, 255, 0) if current_gesture == "draw" else (0, 0, 255) if current_gesture == "erase" else (255, 255, 255)
                cv2.circle(frame, current_point, 10, color, -1)
        
        # Update canvas based on gesture
        self.draw_on_canvas(current_point, current_gesture)
        
        # Combine frame and canvas
        result = cv2.addWeighted(frame, 0.6, self.canvas, 0.4, 0)
        
        # Add gesture indicator
        if current_gesture != "idle":
            cv2.putText(result, f"Mode: {current_gesture.upper()}", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Show finger states for debugging
        if self.finger_states:
            debug_text = f"Idx:{int(self.finger_states[0])} Mid:{int(self.finger_states[1])} Rng:{int(self.finger_states[2])} Pnk:{int(self.finger_states[3])}"
            cv2.putText(result, debug_text, (10, 60), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
        
        # Add instructions
        cv2.putText(result, "Index only = Pencil", (10, h-40), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.putText(result, "Full hand open = Erase (palm circle)", (10, h-20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return result
    
    def run(self):
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("Error: Could not open webcam")
            return
        
        print("AR Finger Writer started!")
        print("Controls:")
        print("  - Show only index finger = Pencil/Draw")
        print("  - Open full hand (4 fingers) = Erase")
        print("  - Press 'q' to quit")
        print("  - Press 'c' to clear canvas")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            result = self.process_frame(frame)
            cv2.imshow('AR Finger Writer', result)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                self.canvas = np.zeros_like(self.canvas)
                self.prev_point = None
        
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    app = FingerWriter()
    app.run()
