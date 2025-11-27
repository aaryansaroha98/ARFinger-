# Chess Game

A fully functional chess game with move validation, check prevention, and turn-based gameplay, built using Python and Pygame.

## Features

- Complete chess rules implementation
- Move validation for all pieces
- Prevents moves that would leave the king in check
- Turn-based gameplay for two players or vs AI
- AI with three difficulty levels: Easy (random moves), Medium/Hard (material-based evaluation)
- Graphical interface with custom-drawn chess piece icons on a chessboard

## Requirements

- Python 3.x
- Pygame library

## Installation

### Desktop Version
1. Ensure Python 3 is installed on your system.
2. Install Pygame: `pip install pygame`
3. Run the game: `python src/main.py`

### Web Version
1. Run the local web server: `python run_server.py`
2. Open your browser and go to `http://localhost:8000`
3. Enjoy the chess game in your browser!

## How to Play

- Click on a piece to select it (only your pieces during your turn).
- Click on a valid square to move the selected piece.
- The game enforces chess rules and prevents illegal moves.

## Project Structure

- `src/main.py`: Main game file
- `README.md`: This file
- `requirements.txt`: Python dependencies

## Contributing

Feel free to fork and improve the game!

## License

MIT License
