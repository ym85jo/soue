"use client";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ====== 상수 ======
const BOARD_SIZES = [5, 6, 7, 8, 9, 10];
const KNIGHT_MOVES = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

// ====== 타입 정의 ======
interface Position {
  row: number;
  col: number;
}

interface Cell {
  row: number;
  col: number;
  visitedOrder?: number;
}

interface GameState {
  board: Cell[][];
  knightPos: Position;
  moveCount: number;
  possibleMoves: Position[];
}

// ====== 유틸리티 함수 ======
const getCellColor = (row: number, col: number): string => {
  return (row + col) % 2 === 0 ? "bg-white" : "bg-gray-100";
};

const isSamePosition = (a: Position, b: Position): boolean => {
  return a.row === b.row && a.col === b.col;
};

const getValidMoves = (
  row: number,
  col: number,
  board: Cell[][],
  boardSize: number
): Position[] => {
  const moves: Position[] = [];

  for (const [dr, dc] of KNIGHT_MOVES) {
    const newRow = row + dr;
    const newCol = col + dc;

    if (
      newRow >= 0 &&
      newCol >= 0 &&
      newRow < boardSize &&
      newCol < boardSize &&
      !board[newRow][newCol].visitedOrder
    ) {
      moves.push({ row: newRow, col: newCol });
    }
  }

  return moves;
};

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// ====== 커스텀 훅 ======
const useGameTimer = (
  gameStarted: boolean,
  gameStartTime: Date | null,
  gameEnded: boolean,
  boardSize: number | null
) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // 타이머 업데이트
  useEffect(() => {
    if (!gameStarted || !gameStartTime || gameEnded) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor(
        (now.getTime() - gameStartTime.getTime()) / 1000
      );
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameStartTime, gameEnded]);

  // 게임 설정 변경 시 타이머 리셋
  useEffect(() => {
    setElapsedTime(0);
  }, [boardSize]);

  return elapsedTime;
};

// ====== 메인 컴포넌트 ======
export default function KnightGame() {
  // ====== 상태 관리 ======
  const [boardSize, setBoardSize] = useState<number | null>(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [knightPos, setKnightPos] = useState<Position | null>(null);
  const [moveCount, setMoveCount] = useState(1);
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [history, setHistory] = useState<GameState[]>([]);
  const [showDescription, setShowDescription] = useState(true);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameEnded, setGameEnded] = useState(false);

  const elapsedTime = useGameTimer(
    gameStarted,
    gameStartTime,
    gameEnded,
    boardSize
  );

  // ====== 게임 초기화 함수들 ======
  const initializeBoard = useCallback((size: number): Cell[][] => {
    const newBoard: Cell[][] = [];
    for (let row = 0; row < size; row++) {
      const boardRow: Cell[] = [];
      for (let col = 0; col < size; col++) {
        boardRow.push({ row, col });
      }
      newBoard.push(boardRow);
    }
    return newBoard;
  }, []);

  const resetGame = useCallback(() => {
    if (!boardSize) return;

    const newBoard = initializeBoard(boardSize);
    setBoard(newBoard);
    setKnightPos(null);
    setMoveCount(1);
    setPossibleMoves([]);
    setHistory([]);
    setGameStartTime(new Date());
    setGameEnded(false);
  }, [boardSize, initializeBoard]);

  const startGame = useCallback(() => {
    if (!boardSize) return;
    resetGame();
    setGameStarted(true);
  }, [boardSize, resetGame]);

  const startNewGame = useCallback(() => {
    if (!boardSize) return;
    resetGame();
    setGameStartTime(new Date());
  }, [boardSize, resetGame]);

  // ====== 게임 로직 함수들 ======
  const handleBoardSizeChange = useCallback(
    (newSize: number) => {
      setBoardSize(newSize);
      if (gameStarted) {
        const newBoard = initializeBoard(newSize);
        setBoard(newBoard);
        setKnightPos(null);
        setMoveCount(1);
        setPossibleMoves([]);
        setHistory([]);
        setGameStartTime(new Date());
        setGameEnded(false);
      }
    },
    [gameStarted, initializeBoard]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setBoard(lastState.board.map((r) => r.map((cell) => ({ ...cell }))));
    setKnightPos(lastState.knightPos);
    setMoveCount(lastState.moveCount);
    setPossibleMoves(lastState.possibleMoves);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }, [history]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!gameStarted) return;

      // 기사 아이콘 클릭 시 되돌리기
      if (knightPos && isSamePosition(knightPos, { row, col })) {
        handleUndo();
        return;
      }

      // 초기 위치 선택
      if (!knightPos) {
        setKnightPos({ row, col });
        setBoard((prev) => {
          const copy = prev.map((r) => r.map((cell) => ({ ...cell })));
          copy[row][col].visitedOrder = 1;
          return copy;
        });
        setMoveCount(2);
        setPossibleMoves(getValidMoves(row, col, board, boardSize!));
        setHistory([]);
        return;
      }

      // 이동 가능한 칸만 이동 허용
      const isValid = possibleMoves.some((move) =>
        isSamePosition(move, { row, col })
      );
      if (!isValid) return;

      // 현재 상태 저장 (undo용)
      setHistory((prev) => [
        ...prev,
        {
          board: board.map((r) => r.map((cell) => ({ ...cell }))),
          knightPos: { ...knightPos },
          moveCount,
          possibleMoves: [...possibleMoves],
        },
      ]);

      // 이동 처리
      setKnightPos({ row, col });
      setBoard((prev) => {
        const copy = prev.map((r) => r.map((cell) => ({ ...cell })));
        copy[row][col].visitedOrder = moveCount;
        return copy;
      });
      setMoveCount(moveCount + 1);

      // 다음 이동 가능한 칸 계산
      setTimeout(() => {
        setPossibleMoves(getValidMoves(row, col, board, boardSize!));
      }, 0);
    },
    [
      gameStarted,
      knightPos,
      board,
      boardSize,
      moveCount,
      possibleMoves,
      handleUndo,
    ]
  );

  // ====== 게임 상태 감지 ======
  useEffect(() => {
    if (!gameStarted || !knightPos) return;

    const totalCells = boardSize! * boardSize!;
    const visitedCells = board
      .flat()
      .filter((cell) => cell.visitedOrder).length;

    if (visitedCells === totalCells) {
      toast.success("축하합니다! 모든 칸을 방문했습니다.");
      setGameEnded(true);
    } else if (possibleMoves.length === 0) {
      toast.error("더 이상 이동할 수 없습니다. 게임 오버!");
      setGameEnded(true);
    }
  }, [possibleMoves, gameStarted, knightPos, board, boardSize]);

  // ====== 렌더링 함수들 ======
  const renderBoard = useCallback(() => {
    return (
      <div className="flex justify-center">
        <div
          className="grid gap-1 p-4 bg-gray-50 modern-border"
          style={{ gridTemplateColumns: `repeat(${boardSize}, 40px)` }}
        >
          {board.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isKnight =
                knightPos &&
                isSamePosition(knightPos, { row: rowIdx, col: colIdx });
              const isHighlighted = possibleMoves.some((move) =>
                isSamePosition(move, { row: rowIdx, col: colIdx })
              );

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`
                    w-10 h-10 border flex items-center justify-center cursor-pointer 
                    ${getCellColor(rowIdx, colIdx)}
                    ${isHighlighted ? "ring-2 ring-blue-400 bg-blue-50" : ""}
                    ${
                      !knightPos && !cell.visitedOrder
                        ? "hover:bg-blue-100"
                        : ""
                    }
                    transition-colors
                  `}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                >
                  {isKnight ? (
                    <span className="text-xl">♞</span>
                  ) : cell.visitedOrder ? (
                    <span className="text-xs text-gray-600 font-medium">
                      {cell.visitedOrder}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }, [board, boardSize, knightPos, possibleMoves, handleCellClick]);

  const renderGameInfo = useCallback(() => {
    return (
      <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
        <div>
          <b>{board.flat().filter((cell) => cell.visitedOrder).length}</b>
          {" / "}
          <b>{boardSize! * boardSize!}</b>
        </div>
        <div>
          <b>{formatTime(elapsedTime)}</b>
        </div>
      </div>
    );
  }, [board, boardSize, elapsedTime]);

  const renderGameDescription = useCallback(() => {
    return (
      <div>
        <div className="flex justify-end ">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors flex-shrink-0"
            title="게임 설명"
          >
            <span className="text-sm font-bold">?</span>
          </button>
        </div>
        {showDescription && (
          <div className="flex-1 p-4 bg-blue-50 rounded-lg border border-blue-200 mt-2">
            <p className="text-blue-700 text-sm leading-relaxed">
              &apos;기사의 여행(Knight&apos;s Tour)&apos;은 체스판 위에서 체스
              기물 중 <strong>나이트(기사)</strong>가 움직이는 퍼즐 게임입니다.{" "}
              <br />
              모든 칸을 한 번씩만 방문하면서 나이트의 이동 규칙(L자 형태)으로
              체스판을 순회해야 합니다.
            </p>
          </div>
        )}
      </div>
    );
  }, [showDescription]);

  // ====== 메인 UI 렌더링 ======
  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        기사의 여행 (Knight&apos;s Tour)
      </h1>

      <div className="space-y-6">
        {/* 게임 설정 */}
        <div className="space-y-4">
          <div>
            <select
              value={boardSize || ""}
              onChange={(e) => handleBoardSizeChange(Number(e.target.value))}
              className="w-full modern-border-sm p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              {BOARD_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} x {size}
                </option>
              ))}
            </select>
          </div>

          <button
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
            onClick={gameStarted ? startNewGame : startGame}
            disabled={!boardSize}
          >
            {gameStarted ? "새 게임" : "게임 시작"}
          </button>
        </div>

        <hr className="my-6 border-t border-gray-200" />

        {/* 게임 화면 */}
        {gameStarted && (
          <div className="space-y-4">
            {renderGameInfo()}
            {renderBoard()}
          </div>
        )}

        {renderGameDescription()}
      </div>
    </div>
  );
}
