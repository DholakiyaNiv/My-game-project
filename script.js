document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('status');
    const restartBtn = document.getElementById('restart-btn');

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

    const pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };

    let boardState = [];
    let currentPlayer = 'white';
    let selectedSquare = null;
    let lastMovedPieceElement = null;

    const initialBoardState = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    function createBoard() {
        chessboard.innerHTML = '';
        boardState = JSON.parse(JSON.stringify(initialBoardState));
        
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.classList.add('square');

                if ((i + j) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }

                const pieceCode = boardState[i][j];
                if (pieceCode) {
                    const piece = document.createElement('span');
                    piece.classList.add('piece');
                    piece.innerHTML = pieces[pieceCode];
                    square.appendChild(piece);
                }

                square.dataset.rank = ranks[i];
                square.dataset.file = files[j];
                square.dataset.row = i;
                square.dataset.col = j;
                
                square.addEventListener('click', handleSquareClick);
                chessboard.appendChild(square);
            }
        }
        updateStatus();
        updateBoardOrientation();
    }

    function updateBoardOrientation() {
        if (currentPlayer === 'black') {
            chessboard.classList.add('rotated-board');
        } else {
            chessboard.classList.remove('rotated-board');
        }
    }

    function updateStatus(message = null) {
        if (message) {
            statusDisplay.textContent = message;
        } else {
            statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
        }
    }

    function handleSquareClick(event) {
        const clickedSquare = event.currentTarget;
        const row = parseInt(clickedSquare.dataset.row);
        const col = parseInt(clickedSquare.dataset.col);
        const pieceCode = boardState[row][col];
        const isWhitePiece = pieceCode && pieceCode === pieceCode.toUpperCase();

        if (selectedSquare) {
            const selectedRow = parseInt(selectedSquare.dataset.row);
            const selectedCol = parseInt(selectedSquare.dataset.col);
            const selectedPieceCode = boardState[selectedRow][selectedCol];

            if (isValidMove(selectedRow, selectedCol, row, col, selectedPieceCode)) {
                
                const tempBoardState = JSON.parse(JSON.stringify(boardState));
                tempBoardState[row][col] = selectedPieceCode;
                tempBoardState[selectedRow][selectedCol] = '';

                if (isKingInCheck(currentPlayer, tempBoardState)) {
                    updateStatus("That move would put your king in check!");
                    clearHighlights();
                    selectedSquare = null;
                    return;
                }

                boardState[row][col] = selectedPieceCode;
                boardState[selectedRow][selectedCol] = '';
                
                const pieceElement = selectedSquare.querySelector('.piece');
                if (pieceElement) {
                    if (clickedSquare.hasChildNodes()) {
                        clickedSquare.removeChild(clickedSquare.firstChild);
                    }
                    clickedSquare.appendChild(pieceElement);
                }
                
                checkPawnPromotion(row, col);

                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';

                clearCheckHighlight();
                if (isKingInCheck(currentPlayer, boardState)) {
                    updateStatus(`${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} is in check!`);
                    highlightKingInCheck(currentPlayer);
                } else {
                    updateStatus();
                }
                updateBoardOrientation();
            } else {
                updateStatus("Invalid move!");
            }

            clearHighlights();
            selectedSquare = null;
        } else {
            const isCurrentPlayerPiece = (currentPlayer === 'white' && isWhitePiece) || 
                                         (currentPlayer === 'black' && !isWhitePiece && pieceCode);
            
            if (pieceCode && isCurrentPlayerPiece) {
                selectedSquare = clickedSquare;
                clickedSquare.classList.add('selected');
                highlightValidMoves(row, col);
            } else {
                updateStatus("It's not your turn or that's not your piece.");
            }
        }
    }

    function highlightKingInCheck(player) {
        const kingPos = findKingPosition(player, boardState);
        if (kingPos) {
            const kingSquare = document.querySelector(`[data-row='${kingPos.row}'][data-col='${kingPos.col}']`);
            if (kingSquare) {
                kingSquare.classList.add('in-check');
            }
        }
    }
    
    function clearCheckHighlight() {
        document.querySelectorAll('.in-check').forEach(el => el.classList.remove('in-check'));
    }

    function findKingPosition(player, board) {
        const kingPiece = player === 'white' ? 'K' : 'k';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] === kingPiece) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    function isKingInCheck(player, board) {
        const kingPos = findKingPosition(player, board);
        if (!kingPos) return false;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    const isOpponentPiece = (player === 'white' && piece === piece.toLowerCase()) || 
                                            (player === 'black' && piece === piece.toUpperCase());
                    if (isOpponentPiece) {
                        const originalPlayer = currentPlayer;
                        currentPlayer = player === 'white' ? 'black' : 'white';
                        const checkResult = isValidMoveForCheck(r, c, kingPos.row, kingPos.col, piece, board);
                        currentPlayer = originalPlayer;
                        if (checkResult) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function isValidMoveForCheck(startRow, startCol, endRow, endCol, piece, board) {
        const pieceType = piece.toLowerCase();
        const destinationPiece = board[endRow][endCol];
        const isWhite = (piece === piece.toUpperCase());
        const destinationIsSameColor = destinationPiece && (isWhite ? destinationPiece === destinationPiece.toUpperCase() : destinationPiece === destinationPiece.toLowerCase());
        if (destinationIsSameColor) return false;

        switch (pieceType) {
            case 'p': return isValidPawnMoveForCheck(startRow, startCol, endRow, endCol, piece, board);
            case 'r': return isValidRookMove(startRow, startCol, endRow, endCol, board);
            case 'n': return isValidKnightMove(startRow, startCol, endRow, endCol);
            case 'b': return isValidBishopMove(startRow, startCol, endRow, endCol, board);
            case 'q': return isValidQueenMove(startRow, startCol, endRow, endCol, board);
            case 'k': return isValidKingMove(startRow, startCol, endRow, endCol);
        }
        return false;
    }

    function isValidMove(startRow, startCol, endRow, endCol, piece) {
        const pieceType = piece.toLowerCase();
        const destinationPiece = boardState[endRow][endCol];
        const isWhite = (piece === piece.toUpperCase());
        const destinationIsSameColor = destinationPiece && (isWhite ? destinationPiece === destinationPiece.toUpperCase() : destinationPiece === destinationPiece.toLowerCase());
        if (destinationIsSameColor) return false;

        switch (pieceType) {
            case 'p': return isValidPawnMove(startRow, startCol, endRow, endCol, piece);
            case 'r': return isValidRookMove(startRow, startCol, endRow, endCol, boardState);
            case 'n': return isValidKnightMove(startRow, startCol, endRow, endCol);
            case 'b': return isValidBishopMove(startRow, startCol, endRow, endCol, boardState);
            case 'q': return isValidQueenMove(startRow, startCol, endRow, endCol, boardState);
            case 'k': return isValidKingMove(startRow, startCol, endRow, endCol);
        }
        return false;
    }

    function isPathClear(startRow, startCol, endRow, endCol, board) {
        const rowStep = Math.sign(endRow - startRow);
        const colStep = Math.sign(endCol - startCol);
        let currentRow = startRow + rowStep;
        let currentCol = startCol + colStep;

        while (currentRow !== endRow || currentCol !== endCol) {
            if (board[currentRow][currentCol] !== '') {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        return true;
    }

    function isValidPawnMove(startRow, startCol, endRow, endCol, piece) {
        const isWhite = (piece === 'P');
        const direction = isWhite ? -1 : 1;
        const startRank = isWhite ? 6 : 1;
        
        const destinationPiece = boardState[endRow][endCol];
        const destinationIsOccupiedByOpponent = destinationPiece && 
                                               (isWhite ? destinationPiece === destinationPiece.toLowerCase() : destinationPiece === destinationPiece.toUpperCase());

        if (startCol === endCol) { 
            if (destinationPiece !== '') return false;
            if (endRow === startRow + direction) return true;
            if (startRow === startRank && endRow === startRow + 2 * direction) {
                const oneStepForwardRow = startRow + direction;
                if (boardState[oneStepForwardRow][startCol] === '') return true;
            }
        } else if (Math.abs(startCol - endCol) === 1) { 
            if (endRow === startRow + direction) {
                if (destinationIsOccupiedByOpponent) return true;
            }
        }
        return false;
    }

    function isValidPawnMoveForCheck(startRow, startCol, endRow, endCol, piece, board) {
        const isWhite = (piece === 'P');
        const direction = isWhite ? -1 : 1;
        if (startCol === endCol) return false;
        if (Math.abs(startCol - endCol) === 1) {
            if (endRow === startRow + direction) {
                return true;
            }
        }
        return false;
    }

    function isValidRookMove(startRow, startCol, endRow, endCol, board) {
        if (startRow === endRow || startCol === endCol) {
            return isPathClear(startRow, startCol, endRow, endCol, board);
        }
        return false;
    }
    
    function isValidKnightMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    function isValidBishopMove(startRow, startCol, endRow, endCol, board) {
        if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol)) {
            return isPathClear(startRow, startCol, endRow, endCol, board);
        }
        return false;
    }

    function isValidQueenMove(startRow, startCol, endRow, endCol, board) {
        return isValidRookMove(startRow, startCol, endRow, endCol, board) ||
               isValidBishopMove(startRow, startCol, endRow, endCol, board);
    }

    function isValidKingMove(startRow, startCol, endRow, endCol) {
        const rowDiff = Math.abs(startRow - endRow);
        const colDiff = Math.abs(startCol - endCol);
        return rowDiff <= 1 && colDiff <= 1;
    }
    
    function checkPawnPromotion(row, col) {
        const piece = boardState[row][col];
        if (!piece || piece.toLowerCase() !== 'p') return;

        const isWhite = (piece === 'P');
        const promotionRank = isWhite ? 0 : 7;

        if (row === promotionRank) {
            const newPiece = isWhite ? 'Q' : 'q';
            boardState[row][col] = newPiece;

            const promotedPieceElement = document.querySelector(`[data-row='${row}'][data-col='${col}'] .piece`);
            if (promotedPieceElement) {
                promotedPieceElement.innerHTML = pieces[newPiece];
            }
        }
    }
    
    function highlightValidMoves(startRow, startCol) {
        const piece = boardState[startRow][startCol];
        if (!piece) return;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const tempBoardState = JSON.parse(JSON.stringify(boardState));
                tempBoardState[row][col] = piece;
                tempBoardState[startRow][startCol] = '';
                
                if (isValidMove(startRow, startCol, row, col, piece) && !isKingInCheck(currentPlayer, tempBoardState)) {
                    const square = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
                    if (square) {
                        square.classList.add('valid-move');
                    }
                }
            }
        }
    }
    
    function clearHighlights() {
        document.querySelectorAll('.selected').forEach(sq => sq.classList.remove('selected'));
        document.querySelectorAll('.valid-move').forEach(sq => sq.classList.remove('valid-move'));
    }

    function restartGame() {
        currentPlayer = 'white';
        selectedSquare = null;
        clearHighlights();
        clearCheckHighlight();
        lastMovedPieceElement = null;
        createBoard();
    }

    restartBtn.addEventListener('click', restartGame);
    
    createBoard();
});