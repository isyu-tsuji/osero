import React, { useState, useEffect } from 'react';

const OthelloGame = () => {
  const BOARD_SIZE = 8;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  
  const initializeBoard = () => {
    const board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    // 初期配置
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    return board;
  };
  
  const [gameMode, setGameMode] = useState(null); // null, 'cpu', 'player'
  const [designMode, setDesignMode] = useState('classic'); // 'classic', 'neon', 'cosmic', 'retro'
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [board, setBoard] = useState(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState(BLACK);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState({ black: 2, white: 2 });
  const [validMoves, setValidMoves] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [animatingCells, setAnimatingCells] = useState(new Set());
  const [winner, setWinner] = useState(null);
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  const isValidPosition = (row, col) => {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  };
  
  const canFlip = (board, row, col, player, direction) => {
    const [dr, dc] = direction;
    let r = row + dr;
    let c = col + dc;
    let hasOpponentPiece = false;
    
    while (isValidPosition(r, c) && board[r][c] !== EMPTY) {
      if (board[r][c] === player) {
        return hasOpponentPiece;
      }
      hasOpponentPiece = true;
      r += dr;
      c += dc;
    }
    return false;
  };
  
  const isValidMove = (board, row, col, player) => {
    if (board[row][col] !== EMPTY) return false;
    return directions.some(direction => canFlip(board, row, col, player, direction));
  };
  
  const getValidMoves = (board, player) => {
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (isValidMove(board, row, col, player)) {
          moves.push([row, col]);
        }
      }
    }
    return moves;
  };
  
  const flipPieces = (board, row, col, player, direction) => {
    const [dr, dc] = direction;
    let r = row + dr;
    let c = col + dc;
    const toFlip = [];
    
    while (isValidPosition(r, c) && board[r][c] !== EMPTY && board[r][c] !== player) {
      toFlip.push([r, c]);
      r += dr;
      c += dc;
    }
    
    if (isValidPosition(r, c) && board[r][c] === player) {
      toFlip.forEach(([flipR, flipC]) => {
        board[flipR][flipC] = player;
      });
    }
  };
  
  const evaluateBoard = (board) => {
    // 簡単なAI評価関数
    let score = 0;
    const corners = [[0,0], [0,7], [7,0], [7,7]];
    const edges = [];
    
    // エッジを定義
    for (let i = 0; i < BOARD_SIZE; i++) {
      edges.push([0, i], [7, i], [i, 0], [i, 7]);
    }
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === WHITE) {
          score += 1;
          // 角は価値が高い
          if (corners.some(([r, c]) => r === row && c === col)) {
            score += 10;
          }
          // エッジも価値が高い
          else if (edges.some(([r, c]) => r === row && c === col)) {
            score += 2;
          }
        } else if (board[row][col] === BLACK) {
          score -= 1;
          if (corners.some(([r, c]) => r === row && c === col)) {
            score -= 10;
          }
          else if (edges.some(([r, c]) => r === row && c === col)) {
            score -= 2;
          }
        }
      }
    }
    return score;
  };
  
  const minimax = (board, depth, player, isMaximizing) => {
    if (depth === 0) {
      return evaluateBoard(board);
    }
    
    const moves = getValidMoves(board, player);
    if (moves.length === 0) {
      return evaluateBoard(board);
    }
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const [row, col] of moves) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = player;
        
        directions.forEach(direction => {
          if (canFlip(newBoard, row, col, player, direction)) {
            flipPieces(newBoard, row, col, player, direction);
          }
        });
        
        const score = minimax(newBoard, depth - 1, player === WHITE ? BLACK : WHITE, false);
        maxScore = Math.max(maxScore, score);
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const [row, col] of moves) {
        const newBoard = board.map(row => [...row]);
        newBoard[row][col] = player;
        
        directions.forEach(direction => {
          if (canFlip(newBoard, row, col, player, direction)) {
            flipPieces(newBoard, row, col, player, direction);
          }
        });
        
        const score = minimax(newBoard, depth - 1, player === WHITE ? BLACK : WHITE, true);
        minScore = Math.min(minScore, score);
      }
      return minScore;
    }
  };
  
  const getBestMove = (board, player) => {
    const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5;
    const moves = getValidMoves(board, player);
    if (moves.length === 0) return null;
    
    if (difficulty === 'easy') {
      // 簡単: ランダムに近い選択
      const randomMoves = moves.slice(0, Math.min(3, moves.length));
      return randomMoves[Math.floor(Math.random() * randomMoves.length)];
    }
    
    let bestMove = moves[0];
    let bestScore = player === WHITE ? -Infinity : Infinity;
    
    for (const [row, col] of moves) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = player;
      
      directions.forEach(direction => {
        if (canFlip(newBoard, row, col, player, direction)) {
          flipPieces(newBoard, row, col, player, direction);
        }
      });
      
      const score = minimax(newBoard, depth - 1, player === WHITE ? BLACK : WHITE, player === WHITE);
      
      if (player === WHITE && score > bestScore) {
        bestScore = score;
        bestMove = [row, col];
      } else if (player === BLACK && score < bestScore) {
        bestScore = score;
        bestMove = [row, col];
      }
    }
    
    return bestMove;
  };
  
  const makeMove = (row, col) => {
    if (gameOver || !isValidMove(board, row, col, currentPlayer)) return;
    
    // アニメーション開始
    setAnimatingCells(prev => new Set([...prev, `${row}-${col}`]));
    
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    
    const flippedCells = [];
    directions.forEach(direction => {
      if (canFlip(newBoard, row, col, currentPlayer, direction)) {
        const [dr, dc] = direction;
        let r = row + dr;
        let c = col + dc;
        while (isValidPosition(r, c) && newBoard[r][c] !== EMPTY && newBoard[r][c] !== currentPlayer) {
          flippedCells.push(`${r}-${c}`);
          r += dr;
          c += dc;
        }
        flipPieces(newBoard, row, col, currentPlayer, direction);
      }
    });
    
    // ひっくり返るアニメーション
    flippedCells.forEach(cell => {
      setAnimatingCells(prev => new Set([...prev, cell]));
    });
    
    setTimeout(() => {
      setBoard(newBoard);
      
      // スコア計算
      let blackCount = 0;
      let whiteCount = 0;
      newBoard.forEach(row => {
        row.forEach(cell => {
          if (cell === BLACK) blackCount++;
          else if (cell === WHITE) whiteCount++;
        });
      });
      setScore({ black: blackCount, white: whiteCount });
      
      // アニメーション終了
      setTimeout(() => {
        setAnimatingCells(new Set());
      }, 300);
      
      // 次のプレイヤーに交代
      const nextPlayer = currentPlayer === BLACK ? WHITE : BLACK;
      const nextValidMoves = getValidMoves(newBoard, nextPlayer);
      
      if (nextValidMoves.length === 0) {
        const currentValidMoves = getValidMoves(newBoard, currentPlayer);
        if (currentValidMoves.length === 0) {
          setGameOver(true);
          const finalWinner = blackCount > whiteCount ? '黒' : whiteCount > blackCount ? '白' : '引き分け';
          setWinner(finalWinner);
        }
      } else {
        setCurrentPlayer(nextPlayer);
      }
    }, 200);
  };
  
  const makeCPUMove = () => {
    if (gameOver || currentPlayer !== WHITE || gameMode !== 'cpu') return;
    
    setThinking(true);
    setTimeout(() => {
      const bestMove = getBestMove(board, WHITE);
      if (bestMove) {
        makeMove(bestMove[0], bestMove[1]);
      }
      setThinking(false);
    }, 500);
  };
  
  const resetGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer(BLACK);
    setGameOver(false);
    setScore({ black: 2, white: 2 });
    setThinking(false);
    setShowHint(false);
    setAnimatingCells(new Set());
    setWinner(null);
  };
  
  const startGame = (mode) => {
    setGameMode(mode);
    resetGame();
  };
  
  const backToMenu = () => {
    setGameMode(null);
    resetGame();
  };
  
  const getDesignClasses = () => {
    switch (designMode) {
      case 'neon':
        return {
          background: 'bg-gradient-to-br from-purple-900 via-blue-900 to-black',
          boardBg: 'bg-gradient-to-br from-purple-800 to-indigo-900',
          cell: 'bg-gradient-to-br from-purple-600 to-indigo-700 border-cyan-300',
          cellHover: 'hover:from-purple-500 hover:to-indigo-600 shadow-lg shadow-cyan-400/50',
          cellHighlight: 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/50',
          hintHighlight: 'ring-4 ring-cyan-300 shadow-xl shadow-cyan-300/70 animate-pulse',
          blackPiece: 'text-purple-300 drop-shadow-lg',
          whitePiece: 'text-cyan-300 drop-shadow-lg',
          text: 'text-cyan-100',
          button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg',
          card: 'bg-gradient-to-br from-purple-800/90 to-indigo-900/90 backdrop-blur-sm border border-cyan-400/30'
        };
      case 'cosmic':
        return {
          background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
          boardBg: 'bg-gradient-to-br from-slate-800 to-purple-900',
          cell: 'bg-gradient-to-br from-slate-700 to-purple-800 border-pink-300/50',
          cellHover: 'hover:from-slate-600 hover:to-purple-700 shadow-lg shadow-pink-400/50',
          cellHighlight: 'ring-2 ring-pink-400 shadow-lg shadow-pink-400/50',
          hintHighlight: 'ring-4 ring-pink-300 shadow-xl shadow-pink-300/70 animate-pulse',
          blackPiece: 'text-slate-200 drop-shadow-lg',
          whitePiece: 'text-pink-300 drop-shadow-lg',
          text: 'text-pink-100',
          button: 'bg-gradient-to-r from-slate-700 to-purple-700 hover:from-slate-600 hover:to-purple-600 text-white shadow-lg',
          card: 'bg-gradient-to-br from-slate-800/90 to-purple-900/90 backdrop-blur-sm border border-pink-400/30'
        };
      case 'retro':
        return {
          background: 'bg-gradient-to-br from-gray-900 to-black',
          boardBg: 'bg-gray-800 border-4 border-green-400',
          cell: 'bg-black border border-green-400',
          cellHover: 'hover:bg-gray-900 hover:border-green-300',
          cellHighlight: 'ring-2 ring-green-400 bg-gray-900',
          hintHighlight: 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-400/70 animate-pulse bg-yellow-900/30',
          blackPiece: 'text-green-400 font-mono drop-shadow-lg',
          whitePiece: 'text-yellow-400 font-mono drop-shadow-lg',
          text: 'text-green-400 font-mono',
          button: 'bg-green-600 hover:bg-green-500 text-black font-mono border-2 border-green-400',
          card: 'bg-black border-2 border-green-400'
        };
      default: // classic
        return {
          background: 'bg-green-50',
          boardBg: 'bg-green-800',
          cell: 'bg-green-600 border-green-700',
          cellHover: 'hover:bg-green-500',
          cellHighlight: 'ring-2 ring-yellow-400',
          hintHighlight: 'ring-4 ring-yellow-300 shadow-xl shadow-yellow-300/70 animate-pulse',
          blackPiece: 'text-black',
          whitePiece: 'text-white',
          text: 'text-green-800',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'bg-white border border-gray-200'
        };
    }
  };
  
  const designs = getDesignClasses();
  
  const getDesignName = () => {
    switch (designMode) {
      case 'neon': return 'ネオン';
      case 'cosmic': return 'コズミック';
      case 'retro': return 'レトロ';
      default: return 'クラシック';
    }
  };
  
  const getPieceSymbol = (piece) => {
    if (designMode === 'neon') {
      return piece === BLACK ? '◆' : '◇';
    } else if (designMode === 'cosmic') {
      return piece === BLACK ? '▲' : '△';
    } else if (designMode === 'retro') {
      return piece === BLACK ? '█' : '▒';
    }
    return piece === BLACK ? '●' : '○';
  };
  
  const getHint = () => {
    if (gameMode === 'cpu' && currentPlayer === WHITE) return null;
    return getBestMove(board, currentPlayer);
  };
  
  useEffect(() => {
    if (gameMode) {
      setValidMoves(getValidMoves(board, currentPlayer));
    }
  }, [board, currentPlayer, gameMode]);
  
  useEffect(() => {
    if (gameMode === 'cpu' && currentPlayer === WHITE && !gameOver) {
      makeCPUMove();
    }
  }, [currentPlayer, gameMode, gameOver]);
  
  const getCellContent = (row, col) => {
    const cell = board[row][col];
    if (cell === BLACK) return getPieceSymbol(BLACK);
    if (cell === WHITE) return getPieceSymbol(WHITE);
    return '';
  };
  
  const isCellClickable = (row, col) => {
    if (gameMode === 'cpu' && currentPlayer === WHITE) return false;
    return !gameOver && validMoves.some(([r, c]) => r === row && c === col);
  };
  
  const isHintCell = (row, col) => {
    if (!showHint) return false;
    const hint = getHint();
    return hint && hint[0] === row && hint[1] === col;
  };
  
  // メニュー画面
  if (!gameMode) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-6 ${designs.background}`}>
        <h1 className={`text-4xl font-bold mb-8 ${designs.text}`}>オセロゲーム</h1>
        
        {/* デザイン選択 */}
        <div className={`${designs.card} rounded-lg shadow-lg p-6 mb-6 max-w-md`}>
          <h3 className={`text-lg font-semibold mb-4 text-center ${designs.text}`}>デザインテーマ</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {key: 'classic', name: 'クラシック'},
              {key: 'neon', name: 'ネオン'},
              {key: 'cosmic', name: 'コズミック'},
              {key: 'retro', name: 'レトロ'}
            ].map(theme => (
              <button
                key={theme.key}
                onClick={() => setDesignMode(theme.key)}
                className={`px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  designMode === theme.key 
                    ? designs.button.includes('gradient') 
                      ? `${designs.button} ring-2` 
                      : `${designs.button} ring-2 ring-blue-400`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 難易度選択 */}
        <div className={`${designs.card} rounded-lg shadow-lg p-6 mb-6 max-w-md`}>
          <h3 className={`text-lg font-semibold mb-4 text-center ${designs.text}`}>CPU難易度</h3>
          <div className="flex gap-2">
            {[
              {key: 'easy', name: '初級'},
              {key: 'medium', name: '中級'},
              {key: 'hard', name: '上級'}
            ].map(level => (
              <button
                key={level.key}
                onClick={() => setDifficulty(level.key)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  difficulty === level.key 
                    ? designs.button.includes('gradient') 
                      ? `${designs.button} ring-2` 
                      : `${designs.button} ring-2 ring-blue-400`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className={`${designs.card} rounded-lg shadow-lg p-8 max-w-md`}>
          <h2 className={`text-2xl font-semibold mb-6 text-center ${designs.text}`}>ゲームモードを選択</h2>
          <div className="space-y-4">
            <button
              onClick={() => startGame('cpu')}
              className={`w-full px-6 py-4 rounded-lg transition-all duration-200 font-semibold text-lg ${designs.button}`}
            >
              🤖 CPUと対戦
            </button>
            <button
              onClick={() => startGame('player')}
              className={`w-full px-6 py-4 rounded-lg transition-all duration-200 font-semibold text-lg ${designs.button}`}
            >
              👥 プレイヤー同士で対戦
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ゲーム画面
  return (
    <div className={`flex flex-col items-center p-6 min-h-screen ${designs.background}`}>
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <button
          onClick={backToMenu}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${designs.button}`}
        >
          ← メニュー
        </button>
        <h1 className={`text-xl font-bold ${designs.text}`}>
          {gameMode === 'cpu' ? `CPU対戦(${difficulty === 'easy' ? '初級' : difficulty === 'medium' ? '中級' : '上級'})` : 'プレイヤー対戦'}
        </h1>
      </div>
      
      <div className={`text-sm mb-2 ${designs.text} opacity-75`}>
        テーマ: {getDesignName()}
      </div>
      
      {/* 勝利演出 */}
      {gameOver && winner && winner !== '引き分け' && (
        <div className="mb-4 animate-bounce">
          <div className={`text-2xl ${designs.text}`}>🎉 {winner}の勝利！ 🎉</div>
        </div>
      )}
      
      <div className="mb-4 text-center">
        <div className="flex justify-center gap-8 mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${designs.blackPiece}`}>{getPieceSymbol(BLACK)}</span>
            <span className={`font-semibold ${designs.text}`}>黒: {score.black}</span>
            {gameMode === 'cpu' && <span className={`text-sm ${designs.text} opacity-75`}>(あなた)</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl ${designs.whitePiece}`}>{getPieceSymbol(WHITE)}</span>
            <span className={`font-semibold ${designs.text}`}>白: {score.white}</span>
            {gameMode === 'cpu' && <span className={`text-sm ${designs.text} opacity-75`}>(CPU)</span>}
          </div>
        </div>
        
        {!gameOver && (
          <div className={`text-lg font-semibold ${designs.text}`}>
            {thinking ? (
              <span className="animate-pulse">🤖 CPUが考え中...</span>
            ) : (
              <>現在のターン: <span className={currentPlayer === BLACK ? designs.blackPiece : designs.whitePiece}>{getPieceSymbol(currentPlayer)}</span>{currentPlayer === BLACK ? '黒' : '白'}</>
            )}
          </div>
        )}
        
        {gameOver && (
          <div className={`text-xl font-bold ${designs.text}`}>
            ゲーム終了！勝者: {winner}
          </div>
        )}
      </div>
      
      {/* ヒントボタン */}
      {/* ヒントボタン */}
      <div className="mb-2 h-8 flex items-center justify-center">
        {!gameOver && (gameMode !== 'cpu' || (gameMode === 'cpu' && currentPlayer === BLACK)) && (
          <button
            onClick={() => setShowHint(!showHint)}
            className={`px-4 py-1 text-sm rounded transition-all duration-200 ${designs.button}`}
          >
            💡 {showHint ? 'ヒント非表示' : 'ヒント表示'}
          </button>
        )}
      </div>
      
      <div className={`grid grid-cols-8 gap-1 p-2 rounded-lg mb-4 shadow-2xl ${designs.boardBg}`}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const isAnimating = animatingCells.has(cellKey);
            const isClickable = isCellClickable(rowIndex, colIndex);
            const isHint = isHintCell(rowIndex, colIndex);
            
            return (
              <button
                key={cellKey}
                onClick={() => makeMove(rowIndex, colIndex)}
                className={`
                  w-12 h-12 rounded-sm flex items-center justify-center text-2xl font-bold
                  transition-all duration-300 transform
                  ${designs.cell}
                  ${isClickable ? `${designs.cellHover} ${designs.cellHighlight} cursor-pointer hover:scale-105` : 'cursor-default'}
                  ${isHint ? designs.hintHighlight : ''}
                  ${isAnimating ? 'animate-spin scale-110' : ''}
                  ${cell === BLACK ? designs.blackPiece : designs.whitePiece}
                `}
                disabled={!isClickable || thinking}
              >
                {getCellContent(rowIndex, colIndex)}
              </button>
            );
          })
        )}
      </div>
      
      <button
        onClick={resetGame}
        className={`px-6 py-2 rounded-lg transition-all duration-200 font-semibold ${designs.button}`}
      >
        新しいゲーム
      </button>
      
      <div className={`mt-4 text-sm text-center max-w-md ${designs.text} opacity-75`}>
        💡ヒントボタンで最適手を確認できます
      </div>
    </div>
  );
};

export default OthelloGame;
