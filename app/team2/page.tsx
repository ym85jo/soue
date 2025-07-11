"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { useLocalStorage } from "@/lib/useLocalStorage";

// 선수 타입
interface Player {
  id: string;
  name: string;
  ord: number;
}

const BACKGROUND_COLORS = ["#949aa7", "#cfff61", "#f35b10"];
const PLAYER_COUNT_OPTIONS = [4, 5, 6, 7, 8, 9, 10];
const GAME_COUNT_OPTIONS = [4, 5, 6, 7, 8, 9, 10];

function createDefaultTeams(teamCount: number) {
  const obj: { [key: string]: Player[] } = {};
  for (let i = 1; i <= teamCount; i++) obj[`team${i}`] = [];
  return obj;
}

function createDefaultKeeper(teamCount: number) {
  const obj: { [key: string]: boolean } = {};
  for (let i = 1; i <= teamCount; i++) obj[`team${i}`] = true;
  return obj;
}

function createDefaultTeamColors(teamCount: number) {
  const obj: { [key: string]: string } = {};
  for (let i = 1; i <= teamCount; i++) obj[`team${i}`] = BACKGROUND_COLORS[0];
  return obj;
}

// 각 팀의 출전 명단(P/K/R) 표 데이터 생성 함수
function getLineupTable(
  players: Player[],
  gameCount: number,
  playerCount: number,
  useKeeper: boolean
) {
  const totalCnt = players.length;
  if (totalCnt === 0) return { header: [], rows: [] };
  // 헤더: 선수 이름
  const header = players.map((p) => p.name);
  // 경기별 출전/쉬는/키퍼 인덱스 계산
  const playArray: number[][] = [];
  const restArray: number[][] = [];
  const keeperCount = new Array(totalCnt).fill(0);
  const keeperPlayer = new Array(gameCount).fill(-1);

  for (let i = 0; i < gameCount; i++) {
    const playArrayTemp: number[] = [];
    const restArrayTemp: number[] = [];
    for (let k = 0; k < playerCount; k++) {
      playArrayTemp.push((i * playerCount + k) % totalCnt);
    }
    for (let k = playerCount; k < totalCnt; k++) {
      restArrayTemp.push((i * playerCount + k) % totalCnt);
    }
    // 쉬는 사람 중 키퍼 선정 (최소 출전 횟수 우선)
    let keeperIndex = -1;
    restArrayTemp.forEach((r) => {
      if (keeperIndex === -1) keeperIndex = r;
      if (keeperCount[keeperIndex] > keeperCount[r]) keeperIndex = r;
    });
    if (restArrayTemp.length > 0) {
      keeperCount[keeperIndex] += 1;
      keeperPlayer[i] = keeperIndex;
    }
    playArray.push(playArrayTemp);
    restArray.push(restArrayTemp);
  }

  // 표 데이터 생성
  const rows = [];
  for (let i = 0; i < gameCount; i++) {
    const cells: ("P" | "K" | "R")[] = [];
    for (let idx = 0; idx < totalCnt; idx++) {
      if (playArray[i].includes(idx)) {
        cells.push("P");
      } else {
        if (useKeeper && keeperPlayer[i] === idx) {
          cells.push("K");
        } else {
          cells.push("R");
        }
      }
    }
    rows.push({ game: i + 1, cells });
  }
  return { header, rows };
}

function getToday() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function Team2Page() {
  // 상태(useLocalStorage로 변경)
  const [textareaValue, setTextareaValue] = useState("");
  const [waitingList, setWaitingList] = useLocalStorage<Player[]>(
    "team2-waiting-list",
    []
  );
  const [teams, setTeams] = useLocalStorage<{ [key: string]: Player[] }>(
    "team2-teams",
    createDefaultTeams(4)
  );
  const [teamColors, setTeamColors] = useLocalStorage<{
    [key: string]: string;
  }>("team2-team-colors", createDefaultTeamColors(4));
  const [keeperEnabled, setKeeperEnabled] = useLocalStorage<{
    [key: string]: boolean;
  }>("team2-keeper-enabled", createDefaultKeeper(4));
  const [playerCount, setPlayerCount] = useLocalStorage<number>(
    "team2-player-count",
    5
  );
  const [gameCount, setGameCount] = useLocalStorage<number>(
    "team2-game-count",
    8
  );
  const [showLineupModal, setShowLineupModal] = useState(false);
  const dragItem = useRef<{ player: Player; from: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const teamCountRef = useRef<HTMLSelectElement>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // 반드시 여기서 선언!
  const getTeamHeaderStyle = (teamKey: string) => ({
    backgroundColor: teamColors[teamKey] || "transparent",
    color: ["#949aa7", "#f35b10"].includes(teamColors[teamKey])
      ? "#fff"
      : undefined,
  });

  // 팀 개수 변경 시 상태 초기화
  React.useEffect(() => {
    if (teamCountRef.current && Number(teamCountRef.current.value) !== 4) {
      // 기존 팀에 있던 모든 선수들을 대기자 명단으로 이동
      const allPlayers = Object.values(teams).flat();
      setWaitingList((prev) => [...prev, ...allPlayers]);
      setTeams(createDefaultTeams(4)); // 팀은 4개로 고정
      setTeamColors(createDefaultTeamColors(4));
      setKeeperEnabled(createDefaultKeeper(4));
    }
    // eslint-disable-next-line
  }, []);

  // 팀 색상 변경
  const handleTeamColorChange = (teamKey: string) => {
    setTeamColors((prev) => {
      const currentIdx = BACKGROUND_COLORS.indexOf(
        prev[teamKey] || BACKGROUND_COLORS[0]
      );
      const nextIdx = (currentIdx + 1) % BACKGROUND_COLORS.length;
      return { ...prev, [teamKey]: BACKGROUND_COLORS[nextIdx] };
    });
  };

  // 랜덤 배정
  const handleRandomAssignment = () => {
    const teamCount = Number(teamCountRef.current?.value || 4);
    const allPlayers = [...waitingList, ...Object.values(teams).flat()];
    if (allPlayers.length === 0) return;
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    const newTeams = createDefaultTeams(4); // 항상 4팀 생성
    shuffled.forEach((player, idx) => {
      const teamIdx = (idx % teamCount) + 1;
      const teamKey = `team${teamIdx}`;
      newTeams[teamKey].push({ ...player, id: generateId() });
    });
    setTeams(newTeams);
    setWaitingList([]);
    toast.success("랜덤 배정이 완료되었습니다.");
  };

  // 초기화
  const handleReset = () => {
    if (typeof window !== "undefined") {
      if (!window.confirm("정말 초기화하시겠습니까? 모든 데이터가 삭제됩니다."))
        return;
    }
    setWaitingList([]);
    setTeams(createDefaultTeams(4));
    setTeamColors(createDefaultTeamColors(4));
    setKeeperEnabled(createDefaultKeeper(4));
    setPlayerCount(5);
    setGameCount(8);
    if (typeof window !== "undefined") {
      localStorage.removeItem("team2-waiting-list");
      localStorage.removeItem("team2-teams");
      localStorage.removeItem("team2-team-colors");
      localStorage.removeItem("team2-keeper-enabled");
      localStorage.removeItem("team2-player-count");
      localStorage.removeItem("team2-game-count");
    }
    toast.success("초기화 되었습니다.");
  };

  // 선수 추가
  const handleAddPlayers = () => {
    const names = textareaValue
      .split("\n")
      .map((name) => name.replace(/[^가-힣a-zA-Z]/g, ""))
      .filter((name) => name.length > 0);
    if (names.length === 0) {
      toast.error(
        `선수 이름을 입력해주세요. (한글, 영문만 허용하며 숫자, 특수문자 등은 제거합니다.)`
      );
      return;
    }
    // 현재 대기자+팀에 있는 모든 선수의 ord 중 최대값 구하기
    const allPlayers = [...waitingList, ...Object.values(teams).flat()];
    const maxOrd =
      allPlayers.length > 0
        ? Math.max(...allPlayers.map((p) => p.ord ?? 0))
        : 0;
    const newPlayers: Player[] = names.map((name, idx) => ({
      id: generateId(),
      name,
      ord: maxOrd + idx + 1,
    }));
    setWaitingList((prev) => [...prev, ...newPlayers]);
    setTextareaValue("");
    toast.success(`${names.length}명의 선수가 추가되었습니다.`);
  };

  // 드래그/드롭
  const handleDragStart = (player: Player, from: string) => {
    dragItem.current = { player, from };
  };
  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOverTarget(target);
  };
  const handleDragLeave = (target: string) => {
    if (dragOverTarget === target) setDragOverTarget(null);
  };

  //
  const handleDrop = (to: string) => {
    setDragOverTarget(null);
    if (!dragItem.current) return;
    const { player, from } = dragItem.current;
    if (from === to) return;
    if (from === "waiting" && to.startsWith("team")) {
      setWaitingList((prev) => prev.filter((p) => p.id !== player.id));
      setTeams((prev) => ({ ...prev, [to]: [...(prev[to] || []), player] }));
      toast.success(`${player.name} 선수가 팀 ${to}에 추가되었습니다.`);
    } else if (from.startsWith("team") && to === "waiting") {
      setTeams((prev) => ({
        ...prev,
        [from]: (prev[from] || []).filter((p) => p.id !== player.id),
      }));
      setWaitingList((prev) => [...prev, player]);
      toast.success(`${player.name} 선수가 대기자 명단에 추가되었습니다.`);
    } else if (from.startsWith("team") && to.startsWith("team")) {
      setTeams((prev) => {
        const newFrom = (prev[from] || []).filter((p) => p.id !== player.id);
        const newTo = [...(prev[to] || []), player];
        return { ...prev, [from]: newFrom, [to]: newTo };
      });
      toast.success(`${player.name} 선수가 팀 ${to}로 이동되었습니다.`);
    }
    dragItem.current = null;
  };

  // 삭제(REMOVE)
  const handleDeleteDrop = () => {
    setDragOverTarget(null);
    if (!dragItem.current) return;
    const { player, from } = dragItem.current;
    if (from.startsWith("team")) {
      setTeams((prev) => ({
        ...prev,
        [from]: (prev[from] || []).filter((p) => p.id !== player.id),
      }));
    } else if (from === "waiting") {
      setWaitingList((prev) => prev.filter((p) => p.id !== player.id));
    }
    toast.success(`${player.name} 선수가 삭제되었습니다.`);
    dragItem.current = null;
  };

  // 경기 설정 UI
  const renderGameSettings = () => (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <label htmlFor="playerCount" className="text-sm">
          필드 인원 수
        </label>
        <select
          id="playerCount"
          className="modern-border-sm p-2"
          value={playerCount}
          onChange={(e) => setPlayerCount(Number(e.target.value))}
        >
          {PLAYER_COUNT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}명
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="gameCount" className="text-sm">
          총 경기 수
        </label>
        <select
          id="gameCount"
          className="modern-border-sm p-2"
          value={gameCount}
          onChange={(e) => setGameCount(Number(e.target.value))}
        >
          {GAME_COUNT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}경기
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {Array.from({ length: 4 }).map((_, idx) => {
          const teamKey = `team${idx + 1}`;
          return (
            <div key={teamKey} className="flex items-center gap-1">
              <input
                type="checkbox"
                id={`keeper-${teamKey}`}
                checked={!!keeperEnabled[teamKey]}
                onChange={(e) =>
                  setKeeperEnabled((prev) => ({
                    ...prev,
                    [teamKey]: e.target.checked,
                  }))
                }
                className="accent-blue-600"
              />
              <label htmlFor={`keeper-${teamKey}`} className="">{`팀 ${
                idx + 1
              } 키퍼`}</label>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 렌더 함수
  const renderWaitingList = () => (
    <div className="flex gap-2 w-full">
      <div
        className={`modern-border rounded p-4 min-h-[100px] bg-gray-50 mt-1 w-5/6 transition-colors duration-150 ${
          dragOverTarget === "waiting" ? "bg-gray-200" : ""
        }`}
        onDragOver={(e) => handleDragOver(e, "waiting")}
        onDragLeave={() => handleDragLeave("waiting")}
        onDrop={() => handleDrop("waiting")}
      >
        {waitingList.length === 0 && (
          <div className="text-gray-400 text-sm">대기자가 없습니다.</div>
        )}
        <div className="flex flex-wrap gap-2">
          {waitingList.map((player) => (
            <div
              key={player.id}
              className="bg-white border rounded px-3 py-1 cursor-move inline-block"
              draggable
              onDragStart={() => handleDragStart(player, "waiting")}
            >
              {player.name}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 w-1/6 items-center justify-start">
        <div
          className={`border rounded p-4 min-h-[100px] mt-1 flex flex-col items-center justify-center w-full transition-all duration-150 ${
            dragOverTarget === "delete"
              ? "border-red-400 bg-red-200 shadow-lg shadow-red-200/50"
              : "border-red-200 bg-red-100"
          }`}
          onDragOver={(e) => handleDragOver(e, "delete")}
          onDragLeave={() => handleDragLeave("delete")}
          onDrop={handleDeleteDrop}
        >
          <span className="font-semibold text-sm text-red-400 flex flex-col items-center justify-center transition-transform duration-150">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
              />
            </svg>
            REMOVE
          </span>
        </div>
      </div>
    </div>
  );

  const renderTeams = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
      {Array.from({ length: 4 }).map((_, idx) => {
        const teamKey = `team${idx + 1}`;
        let teamPlayers = teams[teamKey] || [];
        teamPlayers = [...teamPlayers].sort(
          (a, b) => (a.ord ?? 0) - (b.ord ?? 0)
        );
        return (
          <div
            key={teamKey}
            className={`modern-border p-4 min-h-[80px] transition-colors duration-150 ${
              dragOverTarget === teamKey ? "bg-gray-200" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, teamKey)}
            onDragLeave={() => handleDragLeave(teamKey)}
            onDrop={() => handleDrop(teamKey)}
          >
            <h2
              className="text-md font-semibold mb-2 px-2 py-1 rounded cursor-pointer select-none"
              style={getTeamHeaderStyle(teamKey)}
              onClick={() => handleTeamColorChange(teamKey)}
              title="색상 변경"
            >
              {`팀 ${idx + 1}`}
            </h2>
            {teamPlayers.length === 0 && (
              <div className="text-gray-400 text-sm">선수가 없습니다.</div>
            )}
            <div className="flex flex-wrap gap-2">
              {teamPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-blue-50 modern-border-sm px-2 py-1 cursor-move inline-block"
                  draggable
                  onDragStart={() => handleDragStart(player, teamKey)}
                >
                  {player.name}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // 모달 내 표 렌더링 함수
  const renderLineupTable = (teamKey: string) => {
    let players = teams[teamKey] || [];
    // ord 오름차순 정렬
    players = [...players].sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0));
    const table = getLineupTable(
      players,
      gameCount,
      playerCount,
      keeperEnabled[teamKey]
    );
    if (players.length === 0)
      return <div className="text-gray-400 text-sm">선수가 없습니다.</div>;
    return (
      <table className="w-full text-xs table-fixed">
        <colgroup>
          <col style={{ width: "42px" }} />
          {Array.from({ length: table.header.length }).map((_, idx) => (
            <col key={idx} style={{ width: `${100 / table.header.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td
              className="modern-border px-1 bg-blue-50 text-center"
              style={{ borderRadius: "0" }}
            >
              <button
                className="cursor-point"
                onClick={() => {
                  setKeeperEnabled({
                    ...keeperEnabled,
                    [teamKey]: !keeperEnabled[teamKey],
                  });
                  if (keeperEnabled[teamKey]) {
                    toast.success(`${teamKey}에 고정키퍼가 있습니다.`);
                  } else {
                    toast.success(`${teamKey}에 키퍼 순서를 추가했습니다.`);
                  }
                }}
              >
                Keep
              </button>
            </td>
            {table.header.map((name: string, idx: number) => (
              <td
                key={idx}
                className="modern-border py-1.5 bg-blue-50 text-center"
                style={{ borderRadius: "0" }}
              >
                {name}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map(
            (row: { game: number; cells: ("P" | "K" | "R")[] }, i: number) => (
              <tr key={i}>
                <td
                  className="modern-border px-1 py-1.5 bg-blue-50 text-center"
                  style={{ borderRadius: "0" }}
                >
                  {row.game}경기
                </td>
                {row.cells.map((cell: "P" | "K" | "R", j: number) => (
                  <td
                    key={j}
                    className={`modern-border px-2 text-center ${
                      cell === "P"
                        ? "text-blue-700"
                        : cell === "K"
                        ? "text-red-600"
                        : "text-gray-500"
                    } ${i % 2 === 1 ? "bg-lime-50" : ""}`}
                    style={{ borderRadius: "0" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    );
  };

  // 모달 컴포넌트
  const LineupModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
    >
      <div
        className="bg-white rounded-lg p-2 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">
            Line Up
            <span
              className="text-sm ml-2"
              style={{ fontWeight: "normal", color: "gray" }}
            >
              {getToday()}
            </span>
          </h2>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl"
            onClick={() => setShowLineupModal(false)}
          >
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          {Array.from({ length: 4 }).map((_, idx) => {
            const teamKey = `team${idx + 1}`;
            return (
              <div key={teamKey} className="mb-6">
                <h3
                  className="font-semibold mb-2 px-2 py-1 rounded cursor-pointer"
                  style={getTeamHeaderStyle(teamKey)}
                  onClick={() => handleTeamColorChange(teamKey)}
                >
                  팀 {idx + 1}
                </h3>
                {renderLineupTable(teamKey)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 팀 요약 모달 핸들러
  const handleSummaryView = () => {
    const hasPlayers = Object.values(teams).some((team) => team.length > 0);
    if (hasPlayers) setShowSummaryModal(true);
  };
  const handleCloseSummaryModal = () => setShowSummaryModal(false);

  // 팀 요약 모달 렌더 함수
  const renderSummaryModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={handleCloseSummaryModal}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">팀 요약</h2>
          <button
            onClick={handleCloseSummaryModal}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse modern-border"
            style={{ tableLayout: "fixed", width: "100%" }}
          >
            <thead>
              <tr>
                {Array.from({ length: 4 }).map((_, idx) => {
                  const teamKey = `team${idx + 1}`;
                  const teamPlayers = teams[teamKey] || [];
                  if (teamPlayers.length === 0) return null;
                  return (
                    <th
                      key={teamKey}
                      className="modern-border-sm px-2 py-2 text-center font-semibold"
                      style={{
                        ...getTeamHeaderStyle(teamKey),
                        borderRadius: 0,
                      }}
                    >
                      {`팀 ${idx + 1}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxPlayers = Math.max(
                  ...Object.values(teams).map((team) => (team || []).length)
                );
                return Array.from({ length: maxPlayers }).map((_, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const teamKey = `team${idx + 1}`;
                      const teamPlayers = teams[teamKey] || [];
                      if (teamPlayers.length === 0) return null;
                      const player = teamPlayers[rowIndex];
                      return (
                        <td
                          key={`${teamKey}-${rowIndex}`}
                          className="modern-border-sm px-4 py-2 text-center text-xs"
                        >
                          {player ? player.name : ""}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Team 2.</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 transition"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        className="flex flex-col w-full mt-2
      "
      >
        <textarea
          className="modern-border p-2 mb-2 resize-y min-h-[80px]"
          placeholder="여러 명의 선수를 한 줄에 한 명씩 입력하세요."
          value={textareaValue}
          onChange={(e) => setTextareaValue(e.target.value)}
        />
        <button
          type="button"
          className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700 transition"
          onClick={handleAddPlayers}
        >
          선수추가
        </button>
        <hr className="my-6 border-t border-gray-200" />
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-lg">
              대기자 명단
              <span className="ml-2 text-gray-500 text-base font-normal">
                ({waitingList.length}명)
              </span>
            </h1>

            <div className="flex gap-2">
              <div className="">
                <select
                  ref={teamCountRef}
                  className="modern-border-sm p-2 w-full "
                  defaultValue={4}
                >
                  <option value={2}>2개팀</option>
                  <option value={3}>3개팀</option>
                  <option value={4}>4개팀</option>
                </select>
              </div>

              <button
                type="button"
                className="bg-gray-600 text-white px-2 py-1  rounded hover:bg-gray-700 transition "
                onClick={handleRandomAssignment}
              >
                Random 배정
              </button>
            </div>
          </div>
        </div>
        {renderWaitingList()}
        <hr className="my-6 border-t border-gray-200" />
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-lg">팀 리스트</h1>
            <div>
              <button
                type="button"
                className="bg-gray-600 text-white px-2 py-1  rounded hover:bg-gray-700 transition"
                onClick={handleSummaryView}
              >
                Result
              </button>
            </div>
          </div>
          {renderTeams()}
        </div>
        {/* 경기 설정 UI를 팀 리스트 아래에 배치 */}
        <hr className="my-6 border-t border-gray-200" />

        <div className="flex justify-between items-center">
          <h1 className="text-lg">Line Up</h1>

          <div className="">
            <button
              type="button"
              className="bg-gray-600 text-white px-2 py-1  rounded hover:bg-gray-700 transition"
              onClick={() => setShowLineupModal(true)}
            >
              Result
            </button>
          </div>
        </div>

        <div className="my-2">{renderGameSettings()}</div>
        {/* 출전 명단 보기 버튼 */}
      </div>
      {/* 모달 렌더 */}
      {showLineupModal && <LineupModal />}
      {showSummaryModal && renderSummaryModal()}
    </div>
  );
}
