"use client";
import React, { useState } from "react";
import { toast } from "sonner";

// ====== 상수 및 타입 ======
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

type Cell = {
  row: number;
  col: number;
  visitedOrder?: number;
};

type Pos = { row: number; col: number };

// ====== 유틸 함수 ======
function getCellColor(row: number, col: number) {
  return (row + col) % 2 === 0 ? "bg-white" : "bg-gray-100";
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
  const [showDescription, setShowDescription] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

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
    setGameStartTime(new Date());
    setElapsedTime(0);
    setGameEnded(false);
  }

  // --- 새 게임 시작 (현재 보드 크기 유지) ---
  function startNewGame() {
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
    setGameStartTime(new Date());
    setElapsedTime(0);
    setGameEnded(false);
  }

  // --- 보드 크기 변경 시 게임 재시작 ---
  function handleBoardSizeChange(newSize: number) {
    setBoardSize(newSize);
    if (gameStarted) {
      // 게임이 진행 중이면 새로운 크기로 게임 재시작
      const newBoard: Cell[][] = [];
      for (let r = 0; r < newSize; r++) {
        const row: Cell[] = [];
        for (let c = 0; c < newSize; c++) row.push({ row: r, col: c });
        newBoard.push(row);
      }
      setBoard(newBoard);
      setKnightPos(null);
      setMoveCount(1);
      setPossibleMoves([]);
      setHistory([]);
    }
  }

  // --- 이동/방문 처리 ---
  function handleCellClick(row: number, col: number) {
    if (!gameStarted) return;

    // 기사(말) 아이콘 클릭 시 되돌리기
    if (knightPos && isSamePos(knightPos, { row, col })) {
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

  // --- 시간 포맷 함수 ---
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // --- 타이머 업데이트 ---
  React.useEffect(() => {
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
      setGameEnded(true);
    } else if (possibleMoves.length === 0) {
      // 이동 불가(실패)
      toast.error("더 이상 이동할 수 없습니다. 게임 오버!");
      setGameEnded(true);
    }
  }, [possibleMoves, gameStarted, knightPos, board, boardSize]);

  // --- 렌더링 함수 ---
  function renderBoard() {
    return (
      <div className="flex justify-center">
        <div
          className="grid gap-1 p-4 bg-gray-50 modern-border"
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
                  )} ${highlight ? "ring-2 ring-blue-400 bg-blue-50" : ""} ${
                    !knightPos && !cell.visitedOrder ? "hover:bg-blue-100" : ""
                  } transition-colors`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  style={{ position: "relative" }}
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
  }

  // --- UI ---
  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">기사의 여행 (Knight&apos;s Tour)</h1>

      <div className="mt-4 flex flex-col w-full">
        <div className="modern-border p-4 bg-gray-50">
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-semibold text-gray-700">
                보드 크기 선택:
              </label>
              <select
                onChange={(e) => handleBoardSizeChange(Number(e.target.value))}
                className="mt-2 w-full modern-border-sm p-2 focus:outline-none"
              >
                <option value="">선택하세요</option>
                {BOARD_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} x {size}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={gameStarted ? startNewGame : startGame}
              disabled={!boardSize}
            >
              {gameStarted ? "새 게임" : "게임 시작"}
            </button>
          </div>
        </div>

        {gameStarted && (
          <div className="mt-6 flex flex-col w-full">
            <div className="flex items-center justify-center mb-4 gap-4">
              <div className="text-sm text-gray-500">
                <b>{board.flat().filter((cell) => cell.visitedOrder).length}</b>{" "}
                / <b>{boardSize! * boardSize!}</b>
              </div>
              <div className="text-sm text-gray-500">
                시간: <b>{formatTime(elapsedTime)}</b>
              </div>
            </div>

            {renderBoard()}

            <div className="mt-4 items-center gap-2">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
                title="게임 설명"
              >
                <span className="text-sm font-bold">?</span>
              </button>
              {showDescription && (
                <div className="flex-1 p-4 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                  <p className="text-blue-700 text-sm leading-relaxed">
                    &apos;기사의 여행(Knight&apos;s Tour)&apos;은 체스판 위에서
                    체스 기물 중 <strong>나이트(기사)</strong>가 움직이는 퍼즐
                    게임입니다. 모든 칸을 한 번씩만 방문하면서 나이트의 이동
                    규칙(L자 형태)으로 체스판을 순회해야 합니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
