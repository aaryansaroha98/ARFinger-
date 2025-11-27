# Chess Game

A fully functional chess game with move validation, check prevention, and turn-based gameplay, built using Python and JavaScript.

## Features

- Complete chess rules implementation
- Move validation for all pieces
- Prevents moves that would leave the king in check
- Turn-based gameplay for two players or vs AI
- AI with three difficulty levels: Easy (random moves), Medium/Hard (material-based evaluation)
- Desktop version with Pygame and custom graphics
- Web version with modern UI, fully responsive and mobile-compatible
- Traditional Unicode chess piece symbols

## Requirements

### Desktop Version
- Python 3.x
- Pygame library

### Web Version
- Any modern web browser
- No installation required!

## Installation & Usage

### Desktop Version
1. Ensure Python 3 is installed on your system.
2. Install Pygame: `pip install pygame`
3. Run the game: `python chess-game/src/main.py`

### Web Version
- **Local**: Run `python run_server.py` and open `http://localhost:8001`
- **Online**: Visit the GitHub Pages URL (see below)

## How to Play

- Click on a piece to select it (only your pieces during your turn).
- Click on a valid square to move the selected piece.
- The game enforces chess rules and prevents illegal moves.

## Project Structure

- `index.html`: Web game interface
- `script.js`: Web game logic
- `chess-game/`: Desktop version and assets
  - `src/main.py`: Desktop game file
  - `assets/images/`: Generated piece images
  - `run_server.py`: Local web server script
- `README.md`: This file

## Live Demo

Play the game online at: [GitHub Pages URL will be here after deployment]

## Contributing

Feel free to fork and improve the game!

## Credits

Made by Aaryan Saroha
Instagram: [@aaryan_saroha98](https://instagram.com/aaryan_saroha98)

## License

MIT License
