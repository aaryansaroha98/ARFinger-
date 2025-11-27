import pygame
import sys
import math
import random

# Initialize Pygame
pygame.init()

# Constants
WIDTH, HEIGHT = 800, 800
SQUARE_SIZE = WIDTH // 8
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
LIGHT_BROWN = (240, 217, 181)
DARK_BROWN = (181, 136, 99)

# Piece classes
class Piece:
    def __init__(self, color, type, image=None):
        self.color = color
        self.type = type
        self.image = image
        self.has_moved = False  # for castling and pawn double move

# Board setup
board = [[None for _ in range(8)] for _ in range(8)]

# Initialize pieces
def init_board():
    # Pawns
    for i in range(8):
        board[1][i] = Piece('black', 'pawn')
        board[6][i] = Piece('white', 'pawn')

    # Rooks
    board[0][0] = board[0][7] = Piece('black', 'rook')
    board[7][0] = board[7][7] = Piece('white', 'rook')

    # Knights
    board[0][1] = board[0][6] = Piece('black', 'knight')
    board[7][1] = board[7][6] = Piece('white', 'knight')

    # Bishops
    board[0][2] = board[0][5] = Piece('black', 'bishop')
    board[7][2] = board[7][5] = Piece('white', 'bishop')

    # Queens
    board[0][3] = Piece('black', 'queen')
    board[7][3] = Piece('white', 'queen')

    # Kings
    board[0][4] = Piece('black', 'king')
    board[7][4] = Piece('white', 'king')

init_board()

# Draw board
def draw_board(screen):
    for row in range(8):
        for col in range(8):
            color = LIGHT_BROWN if (row + col) % 2 == 0 else DARK_BROWN
            pygame.draw.rect(screen, color, (col * SQUARE_SIZE, row * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE))

# Draw pieces
def draw_pieces(screen):
    for row in range(8):
        for col in range(8):
            piece = board[row][col]
            if piece:
                draw_piece(screen, row, col, piece)

def draw_piece(screen, row, col, piece):
    x = col * SQUARE_SIZE + SQUARE_SIZE // 2
    y = row * SQUARE_SIZE + SQUARE_SIZE // 2
    color = WHITE if piece.color == 'white' else BLACK
    size = SQUARE_SIZE // 3
    if piece.type == 'pawn':
        pygame.draw.circle(screen, color, (x, y), size // 2)
        pygame.draw.circle(screen, color, (x, y - size // 4), size // 4)  # head
    elif piece.type == 'rook':
        pygame.draw.rect(screen, color, (x - size // 2, y - size // 2, size, size))
        # Towers
        pygame.draw.rect(screen, color, (x - size // 2, y - size, size // 4, size // 2))
        pygame.draw.rect(screen, color, (x + size // 4, y - size, size // 4, size // 2))
    elif piece.type == 'bishop':
        pygame.draw.polygon(screen, color, [(x, y - size), (x - size // 2, y), (x + size // 2, y)])
        pygame.draw.circle(screen, color, (x, y - size // 2), size // 4)
    elif piece.type == 'knight':
        pygame.draw.polygon(screen, color, [(x - size // 2, y), (x - size // 4, y - size), (x + size // 4, y - size), (x + size // 2, y), (x, y + size // 2)])
    elif piece.type == 'queen':
        pygame.draw.circle(screen, color, (x, y), size // 2)
        # Crown
        for i in range(5):
            angle = i * 72 - 90
            px = x + int(size // 2 * math.cos(math.radians(angle)))
            py = y + int(size // 2 * math.sin(math.radians(angle)))
            pygame.draw.circle(screen, color, (px, py), size // 8)
    elif piece.type == 'king':
        pygame.draw.rect(screen, color, (x - size // 4, y - size // 2, size // 2, size))
        # Crown
        pygame.draw.polygon(screen, color, [(x - size // 2, y - size // 2), (x - size // 4, y - size), (x, y - size // 2), (x + size // 4, y - size), (x + size // 2, y - size // 2)])

def is_path_clear(start_row, start_col, end_row, end_col):
    dr = 1 if end_row > start_row else -1 if end_row < start_row else 0
    dc = 1 if end_col > start_col else -1 if end_col < start_col else 0
    r, c = start_row + dr, start_col + dc
    while r != end_row or c != end_col:
        if board[r][c]:
            return False
        r += dr
        c += dc
    return True

def is_valid_move(piece, start_row, start_col, end_row, end_col):
    if board[end_row][end_col] and board[end_row][end_col].color == piece.color:
        return False
    pr, pc = start_row, start_col
    er, ec = end_row, end_col
    dr, dc = er - pr, ec - pc
    if piece.type == 'pawn':
        direction = -1 if piece.color == 'white' else 1
        if dc == 0:
            if dr == direction and not board[er][ec]:
                return True
            if dr == 2 * direction and pr == (6 if piece.color == 'white' else 1) and not board[er][ec] and not board[pr + direction][pc]:
                return True
        elif abs(dc) == 1 and dr == direction and board[er][ec] and board[er][ec].color != piece.color:
            return True
    elif piece.type == 'rook':
        if dr == 0 or dc == 0:
            return is_path_clear(pr, pc, er, ec)
    elif piece.type == 'bishop':
        if abs(dr) == abs(dc):
            return is_path_clear(pr, pc, er, ec)
    elif piece.type == 'queen':
        if dr == 0 or dc == 0 or abs(dr) == abs(dc):
            return is_path_clear(pr, pc, er, ec)
    elif piece.type == 'knight':
        if (abs(dr), abs(dc)) in [(1,2), (2,1)]:
            return True
    elif piece.type == 'king':
        if max(abs(dr), abs(dc)) == 1:
            return True
    return False

def is_in_check(color):
    king_pos = None
    for r in range(8):
        for c in range(8):
            if board[r][c] and board[r][c].type == 'king' and board[r][c].color == color:
                king_pos = (r, c)
                break
    if not king_pos:
        return False
    kr, kc = king_pos
    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if piece and piece.color != color and is_valid_move(piece, r, c, kr, kc):
                return True
    return False

def make_move(start_row, start_col, end_row, end_col):
    piece = board[start_row][start_col]
    # Temp move
    captured = board[end_row][end_col]
    board[end_row][end_col] = piece
    board[start_row][start_col] = None
    piece.has_moved = True
    if is_in_check(piece.color):
        # Revert
        board[start_row][start_col] = piece
        board[end_row][end_col] = captured
        piece.has_moved = False
        return False
    return True

def get_legal_moves(color):
    moves = []
    for r in range(8):
        for c in range(8):
            piece = board[r][c]
            if piece and piece.color == color:
                for er in range(8):
                    for ec in range(8):
                        if is_valid_move(piece, r, c, er, ec):
                            # Simulate move
                            captured = board[er][ec]
                            board[er][ec] = piece
                            board[r][c] = None
                            if not is_in_check(color):
                                moves.append((r, c, er, ec))
                            # Revert
                            board[r][c] = piece
                            board[er][ec] = captured
    return moves

def evaluate_board():
    values = {'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 0}
    score = 0
    for r in range(8):
        for c in range(8):
            p = board[r][c]
            if p:
                val = values[p.type]
                if p.color == 'white':
                    score += val
                else:
                    score -= val
    return score

def ai_move(color, level):
    moves = get_legal_moves(color)
    if not moves:
        return None
    if level == 'easy':
        return random.choice(moves)
    else:
        best_move = None
        best_score = -999 if color == 'white' else 999
        for move in moves:
            sr, sc, er, ec = move
            captured = board[er][ec]
            board[er][ec] = board[sr][sc]
            board[sr][sc] = None
            score = evaluate_board()
            board[sr][sc] = board[er][ec]
            board[er][ec] = captured
            if color == 'white':
                if score > best_score:
                    best_score = score
                    best_move = move
            else:
                if score < best_score:
                    best_score = score
                    best_move = move
        return best_move

# Main loop
def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Chess Game")
    font = pygame.font.SysFont(None, 48)
    clock = pygame.time.Clock()
    selected = None
    current_player = 'white'
    game_mode = None
    level = None

    # Menu
    menu = True
    while menu:
        screen.fill(BLACK)
        text1 = font.render("Press 1 for Two Player", True, WHITE)
        screen.blit(text1, (WIDTH//2 - 150, HEIGHT//2 - 100))
        text2 = font.render("Press 2 for Vs AI", True, WHITE)
        screen.blit(text2, (WIDTH//2 - 150, HEIGHT//2 - 50))
        pygame.display.flip()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_1:
                    game_mode = 'two_player'
                    menu = False
                elif event.key == pygame.K_2:
                    game_mode = 'vs_ai'
                    menu = False
                    level_menu = True
                    while level_menu:
                        screen.fill(BLACK)
                        text1 = font.render("Choose level: 1.Easy 2.Medium 3.Hard", True, WHITE)
                        screen.blit(text1, (WIDTH//2 - 200, HEIGHT//2))
                        pygame.display.flip()
                        for event in pygame.event.get():
                            if event.type == pygame.KEYDOWN:
                                if event.key == pygame.K_1:
                                    level = 'easy'
                                    level_menu = False
                                elif event.key == pygame.K_2:
                                    level = 'medium'
                                    level_menu = False
                                elif event.key == pygame.K_3:
                                    level = 'hard'
                                    level_menu = False

    while True:
        if game_mode == 'vs_ai' and current_player == 'black':
            pygame.time.wait(500)
            move = ai_move('black', level)
            if move:
                sr, sc, er, ec = move
                make_move(sr, sc, er, ec)
                current_player = 'white'
            # else game over

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == pygame.MOUSEBUTTONDOWN and current_player == 'white':
                x, y = pygame.mouse.get_pos()
                col = x // SQUARE_SIZE
                row = y // SQUARE_SIZE
                if selected:
                    piece = board[selected[0]][selected[1]]
                    if piece and piece.color == current_player and is_valid_move(piece, selected[0], selected[1], row, col):
                        if make_move(selected[0], selected[1], row, col):
                            current_player = 'black' if current_player == 'white' else 'white'
                    selected = None
                else:
                    if board[row][col] and board[row][col].color == current_player:
                        selected = (row, col)

        screen.fill(WHITE)
        draw_board(screen)
        draw_pieces(screen)
        if selected:
            pygame.draw.rect(screen, (0, 255, 0), (selected[1] * SQUARE_SIZE, selected[0] * SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE), 3)
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()
