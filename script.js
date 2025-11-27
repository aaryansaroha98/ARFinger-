// Chess piece Unicode symbols
const pieceSymbols = {
    'white': {
        'king': '♔',
        'queen': '♕',
        'rook': '♖',
        'bishop': '♗',
        'knight': '♘',
        'pawn': '♙'
    },
    'black': {
        'king': '♚',
        'queen': '♛',
        'rook': '♜',
        'bishop': '♝',
        'knight': '♞',
        'pawn': '♟'
    }
};

let board = Array(8).fill().map(() => Array(8).fill(null));
let currentPlayer = 'white';
let gameMode = null;
let aiLevel = null;
let selectedSquare = null;

// DOM elements
const menu = document.getElementById('menu');
const levelMenu = document.getElementById('level-menu');
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');

// Event listeners
document.getElementById('two-player-btn').addEventListener('click', () => startGame('two_player'));
document.getElementById('vs-ai-btn').addEventListener('click', () => showLevelMenu());

function showLevelMenu() {
    menu.style.display = 'none';
    levelMenu.style.display = 'block';
    document.getElementById('easy-btn').addEventListener('click', () => startGame('vs_ai', 'easy'));
    document.getElementById('medium-btn').addEventListener('click', () => startGame('vs_ai', 'medium'));
    document.getElementById('hard-btn').addEventListener('click', () => startGame('vs_ai', 'hard'));
}

function startGame(mode, level = null) {
    gameMode = mode;
    aiLevel = level;
    menu.style.display = 'none';
    levelMenu.style.display = 'none';
    initBoard();
    drawBoard();
    updateStatus();
}

function initBoard() {
    // Initialize pawns
    for (let i = 0; i < 8; i++) {
        board[1][i] = { color: 'black', type: 'pawn' };
        board[6][i] = { color: 'white', type: 'pawn' };
    }

    // Initialize other pieces
    const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
        board[0][i] = { color: 'black', type: pieceOrder[i] };
        board[7][i] = { color: 'white', type: pieceOrder[i] };
    }
}

function drawBoard() {
    boardElement.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            square.addEventListener('click', (e) => {
                e.preventDefault();
                handleSquareClick(row, col);
            });
            // Add touch events for mobile
            square.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleSquareClick(row, col);
            });

            const piece = board[row][col];
            if (piece) {
                square.textContent = pieceSymbols[piece.color][piece.type];
            }

            boardElement.appendChild(square);
        }
    }
}

function handleSquareClick(row, col) {
    if (gameMode === 'vs_ai' && currentPlayer === 'black') return;

    if (selectedSquare) {
        const [selectedRow, selectedCol] = selectedSquare;
        const piece = board[selectedRow][selectedCol];

        if (piece && piece.color === currentPlayer && isValidMove(piece, selectedRow, selectedCol, row, col)) {
            if (makeMove(selectedRow, selectedCol, row, col)) {
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                updateStatus();

                if (gameMode === 'vs_ai' && currentPlayer === 'black') {
                    setTimeout(makeAiMove, 500);
                }
            }
        }

        selectedSquare = null;
        drawBoard();
    } else {
        if (board[row][col] && board[row][col].color === currentPlayer) {
            selectedSquare = [row, col];
            drawBoard();
            document.querySelector(`[data-row="${row}"][data-col="${col}"]`).classList.add('selected');
        }
    }
}

function isValidMove(piece, startRow, startCol, endRow, endCol) {
    if (board[endRow][endCol] && board[endRow][endCol].color === piece.color) return false;

    const dr = endRow - startRow;
    const dc = endCol - startCol;

    if (piece.type === 'pawn') {
        const direction = piece.color === 'white' ? -1 : 1;
        if (dc === 0) {
            if (dr === direction && !board[endRow][endCol]) return true;
            if (dr === 2 * direction && startRow === (piece.color === 'white' ? 6 : 1) && !board[endRow][endCol] && !board[startRow + direction][startCol]) return true;
        } else if (Math.abs(dc) === 1 && dr === direction && board[endRow][endCol] && board[endRow][endCol].color !== piece.color) {
            return true;
        }
    } else if (piece.type === 'rook') {
        if (dr === 0 || dc === 0) return isPathClear(startRow, startCol, endRow, endCol);
    } else if (piece.type === 'bishop') {
        if (Math.abs(dr) === Math.abs(dc)) return isPathClear(startRow, startCol, endRow, endCol);
    } else if (piece.type === 'queen') {
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) return isPathClear(startRow, startCol, endRow, endCol);
    } else if (piece.type === 'knight') {
        if ((Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2)) return true;
    } else if (piece.type === 'king') {
        if (Math.max(Math.abs(dr), Math.abs(dc)) === 1) return true;
    }

    return false;
}

function isPathClear(startRow, startCol, endRow, endCol) {
    const dr = Math.sign(endRow - startRow);
    const dc = Math.sign(endCol - startCol);
    let r = startRow + dr;
    let c = startCol + dc;
    while (r !== endRow || c !== endCol) {
        if (board[r][c]) return false;
        r += dr;
        c += dc;
    }
    return true;
}

function makeMove(startRow, startCol, endRow, endCol) {
    const piece = board[startRow][startCol];
    board[endRow][endCol] = piece;
    board[startRow][startCol] = null;

    if (isInCheck(piece.color)) {
        // Revert move
        board[startRow][startCol] = piece;
        board[endRow][endCol] = null;
        return false;
    }

    return true;
}

function isInCheck(color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] && board[r][c].type === 'king' && board[r][c].color === color) {
                kingPos = [r, c];
                break;
            }
        }
        if (kingPos) break;
    }

    if (!kingPos) return false;

    const [kr, kc] = kingPos;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color !== color && isValidMove(piece, r, c, kr, kc)) {
                return true;
            }
        }
    }
    return false;
}

function makeAiMove() {
    const moves = getLegalMoves('black');
    if (moves.length === 0) return;

    let move;
    if (aiLevel === 'easy') {
        move = moves[Math.floor(Math.random() * moves.length)];
    } else {
        // Simple material evaluation
        move = moves.reduce((best, current) => {
            const score = evaluateMove(current);
            return score > best.score ? { move: current, score } : best;
        }, { move: null, score: -Infinity }).move;
    }

    const [sr, sc, er, ec] = move;
    makeMove(sr, sc, er, ec);
    currentPlayer = 'white';
    drawBoard();
    updateStatus();
}

function getLegalMoves(color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === color) {
                for (let er = 0; er < 8; er++) {
                    for (let ec = 0; ec < 8; ec++) {
                        if (isValidMove(piece, r, c, er, ec)) {
                            // Simulate move
                            const captured = board[er][ec];
                            board[er][ec] = piece;
                            board[r][c] = null;
                            if (!isInCheck(color)) {
                                moves.push([r, c, er, ec]);
                            }
                            // Revert
                            board[r][c] = piece;
                            board[er][ec] = captured;
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function evaluateMove(move) {
    const [sr, sc, er, ec] = move;
    const captured = board[er][ec];
    let score = 0;
    if (captured) {
        const values = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 0 };
        score += values[captured.type];
    }
    return score;
}

function updateStatus() {
    statusElement.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
}
