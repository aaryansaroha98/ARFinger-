# AR Finger Writing System

A real-time hand tracking application that allows you to write in the air using your finger and erase with hand gestures, using your webcam.

## Features

- **Pencil Mode**: Use only your index finger to draw in the air
- **Erase Mode**: Open your full hand to erase
- **Real-time Tracking**: Smooth hand landmark detection using MediaPipe
- **Visual Feedback**: See your drawings in real-time on screen

## Requirements

```
pip install opencv-python mediapipe numpy
```

## Usage

1. Run the script:
   ```bash
   python3 finger_writer.py
   ```

2. **Gesture Controls**:
   - **Pencil/Draw**: Show ONLY your index finger (keep middle, ring, and pinky fingers closed)
   - **Erase**: Open your FULL hand (extend all 4 fingers - index, middle, ring, pinky)
   
3. **Other Controls**:
   - Press 'c' to clear the canvas
   - Press 'q' to quit

## How It Works

1. The system uses MediaPipe to detect 21 hand landmarks in real-time
2. When only the index finger is extended, the tip position is tracked to draw green lines
3. When 3 or more fingers are extended (full hand open), the system enters erase mode using the palm
4. The drawing is maintained on a canvas that overlays the video feed

## Tips

- For best results, ensure good lighting
- Keep your hand steady for smoother drawings
- The eraser uses your palm center for erasing

## License

MIT

