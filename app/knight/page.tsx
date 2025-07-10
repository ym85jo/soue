"use client";
import React, { useState } from "react";
import { toast, Toaster } from "sonner";

// ====== 상수 및 타입 ======
const BOARD_SIZES = [4, 5, 6, 7, 8, 9, 10];
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

type Cell = {
  row: number;
  col: number;
  visitedOrder?: number;
};

type Pos = { row: number; col: number };

// ====== 유틸 함수 ======
function getCellColor(row: number, col: number) {
  return (row + col) % 2 === 0 ? "bg-white" : "bg-gray-700";
}

function isSamePos(a: Pos, b: Pos) {
  return a.row === b.row && a.col === b.col;
}

function getValidMoves(
  row: number,
  col: number,
  board: Cell[][],
  boardSize: number
) {
  const moves: Pos[] = [];
  for (const [dr, dc] of KNIGHT_MOVES) {
    const nr = row + dr;
    const nc = col + dc;
    if (
      nr >= 0 &&
      nc >= 0 &&
      nr < boardSize &&
      nc < boardSize &&
      !board[nr][nc].visitedOrder
    ) {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

// ====== 메인 컴포넌트 ======
export default function KnightGame() {
  // --- 상태 ---
  const [boardSize, setBoardSize] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [knightPos, setKnightPos] = useState<Pos | null>(null);
  const [moveCount, setMoveCount] = useState(1);
  const [possibleMoves, setPossibleMoves] = useState<Pos[]>([]);
  const [history, setHistory] = useState<
    {
      board: Cell[][];
      knightPos: Pos;
      moveCount: number;
      possibleMoves: Pos[];
    }[]
  >([]);

  // --- 게임 시작/초기화 ---
  function startGame() {
    if (!boardSize) return;
    const newBoard: Cell[][] = [];
    for (let r = 0; r < boardSize; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < boardSize; c++) row.push({ row: r, col: c });
      newBoard.push(row);
    }
    setBoard(newBoard);
    setKnightPos(null);
    setMoveCount(1);
    setPossibleMoves([]);
    setHistory([]);
    setGameStarted(true);
  }

  // --- 이동/방문 처리 ---
  function handleCellClick(row: number, col: number) {
    if (!gameStarted) return;
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
    const isValid = possibleMoves.some((m) => m.row === row && m.col === col);
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
  }

  // --- Undo ---
  function handleUndo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setBoard(last.board.map((r) => r.map((cell) => ({ ...cell }))));
    setKnightPos(last.knightPos);
    setMoveCount(last.moveCount);
    setPossibleMoves(last.possibleMoves);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }

  // --- 게임 종료/성공 판정 ---
  React.useEffect(() => {
    if (!gameStarted || !knightPos) return;
    const totalCells = boardSize! * boardSize!;
    const visitedCells = board
      .flat()
      .filter((cell) => cell.visitedOrder).length;
    if (visitedCells === totalCells) {
      // 모든 칸 방문 성공
      toast.success("축하합니다! 모든 칸을 방문했습니다.");
    } else if (possibleMoves.length === 0) {
      // 이동 불가(실패)
      toast.error("더 이상 이동할 수 없습니다. 게임 오버!");
    }
  }, [possibleMoves, gameStarted, knightPos, board, boardSize]);

  // --- 렌더링 함수 ---
  function renderBoard() {
    return (
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${boardSize}, 40px)` }}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isKnight =
              knightPos && isSamePos(knightPos, { row: rIdx, col: cIdx });
            const highlight = possibleMoves.some((m) =>
              isSamePos(m, { row: rIdx, col: cIdx })
            );
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-10 h-10 border flex items-center justify-center cursor-pointer ${getCellColor(
                  rIdx,
                  cIdx
                )} ${highlight ? "ring-4 ring-yellow-400 z-10" : ""} ${
                  !knightPos && !cell.visitedOrder ? "hover:bg-yellow-200" : ""
                }`}
                onClick={() => handleCellClick(rIdx, cIdx)}
                style={{ position: "relative" }}
              >
                {isKnight ? (
                  <span className="text-xl">♞</span>
                ) : cell.visitedOrder ? (
                  <span className="text-xs text-gray-500">
                    {cell.visitedOrder}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        기사의 여행 (Knight&apos;s Tour)
      </h1>
      {!gameStarted && (
        <div className="flex flex-col items-center gap-4">
          <label className="font-semibold">보드 크기 선택:</label>
          <select
            onChange={(e) => setBoardSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            <option value="">선택하세요</option>
            {BOARD_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} x {size}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            onClick={startGame}
            disabled={!boardSize}
          >
            게임 시작
          </button>
        </div>
      )}
      {gameStarted && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="mb-2 text-sm">
            방문: {board.flat().filter((cell) => cell.visitedOrder).length} /{" "}
            {boardSize! * boardSize!}
          </div>
          {renderBoard()}
          <div className="mt-4 flex gap-2">
            <button
              className="bg-gray-500 text-white px-3 py-1 rounded"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              되돌리기
            </button>
            <button
              className="bg-gray-500 text-white px-3 py-1 rounded"
              onClick={() => window.location.reload()}
            >
              새 게임
            </button>
          </div>
        </div>
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}
