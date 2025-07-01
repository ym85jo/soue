"use client";

import React, { useState, useRef, useEffect } from "react";

type Player = {
  id: string;
  name: string;
};

type TeamList = {
  [key: string]: Player[];
};

type TeamColors = {
  [key: string]: string;
};

const TEAM_COUNT = 4;

// 배경색 배열 정의
const BACKGROUND_COLORS = ["", "#cfff61", "#f35b10"];

// ===== 유틸 함수 =====
function generateId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 15)
  );
}

function createDefaultTeams(): TeamList {
  const obj: TeamList = {};
  for (let i = 1; i <= TEAM_COUNT; i++) obj[`team${i}`] = [];
  return obj;
}

function createDefaultTeamColors(): TeamColors {
  const obj: TeamColors = {};
  for (let i = 1; i <= TEAM_COUNT; i++) obj[`team${i}`] = "";
  return obj;
}

function loadFromStorage() {
  if (typeof window === "undefined") {
    return {
      waitingList: [],
      teams: createDefaultTeams(),
      teamColors: createDefaultTeamColors(),
      selectedTeamCount: 4,
    };
  }
  try {
    const savedWaitingList = localStorage.getItem("team-waiting-list");
    const savedTeams = localStorage.getItem("team-teams");
    const savedTeamColors = localStorage.getItem("team-colors");
    const savedSelectedTeamCount = localStorage.getItem("team-selected-count");
    let teams: TeamList;
    try {
      teams = savedTeams ? JSON.parse(savedTeams) : createDefaultTeams();
      for (let i = 1; i <= TEAM_COUNT; i++) {
        const teamKey = `team${i}`;
        if (!teams[teamKey] || !Array.isArray(teams[teamKey]))
          teams[teamKey] = [];
      }
    } catch {
      teams = createDefaultTeams();
    }
    let teamColors: TeamColors;
    try {
      teamColors = savedTeamColors
        ? JSON.parse(savedTeamColors)
        : createDefaultTeamColors();
      for (let i = 1; i <= TEAM_COUNT; i++) {
        const teamKey = `team${i}`;
        if (!(teamKey in teamColors)) teamColors[teamKey] = "";
      }
    } catch {
      teamColors = createDefaultTeamColors();
    }
    return {
      waitingList: savedWaitingList ? JSON.parse(savedWaitingList) : [],
      teams,
      teamColors,
      selectedTeamCount: savedSelectedTeamCount
        ? Number(savedSelectedTeamCount)
        : 4,
    };
  } catch {
    return {
      waitingList: [],
      teams: createDefaultTeams(),
      teamColors: createDefaultTeamColors(),
      selectedTeamCount: 4,
    };
  }
}

export default function Team() {
  // --- 상태 선언 ---
  const [isClient, setIsClient] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [waitingList, setWaitingList] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamList>(createDefaultTeams());
  const [teamColors, setTeamColors] = useState<TeamColors>(
    createDefaultTeamColors()
  );
  const [selectedTeamCount, setSelectedTeamCount] = useState<number>(4);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dragItem = useRef<{ player: Player; from: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // --- 데이터 로딩 및 저장 useEffect ---
  useEffect(() => {
    setIsClient(true);
    const data = loadFromStorage();
    setWaitingList(data.waitingList);
    setTeams(data.teams);
    setTeamColors(data.teamColors);
    setSelectedTeamCount(data.selectedTeamCount);
  }, []);
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("team-waiting-list", JSON.stringify(waitingList));
    }
  }, [waitingList, isClient]);
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("team-teams", JSON.stringify(teams));
    }
  }, [teams, isClient]);
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("team-colors", JSON.stringify(teamColors));
    }
  }, [teamColors, isClient]);
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("team-selected-count", selectedTeamCount.toString());
    }
  }, [selectedTeamCount, isClient]);

  // --- 핸들러 함수 ---
  // 모달
  const handleSummaryView = () => {
    const hasPlayers = Object.values(teams).some((team) => team.length > 0);
    if (hasPlayers) setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  // 팀 색상
  const handleTeamColorChange = (teamKey: string) => {
    setTeamColors((prev) => {
      const currentColorIndex = BACKGROUND_COLORS.indexOf(prev[teamKey]);
      const nextColorIndex = (currentColorIndex + 1) % BACKGROUND_COLORS.length;
      return { ...prev, [teamKey]: BACKGROUND_COLORS[nextColorIndex] };
    });
  };
  // 선수 추가
  const handleAddPlayers = () => {
    const names = textareaValue
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
    if (names.length === 0) return;
    const newPlayers: Player[] = names.map((name) => ({
      id: generateId(),
      name,
    }));
    setWaitingList((prev) => [...prev, ...newPlayers]);
    setTextareaValue("");
  };
  // 랜덤 배정
  const handleRandomAssignment = () => {
    const allPlayers = [...waitingList, ...Object.values(teams).flat()];
    if (allPlayers.length === 0) return;
    const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
    const newTeams: TeamList = createDefaultTeams();
    shuffledPlayers.forEach((player, index) => {
      const teamIndex = (index % selectedTeamCount) + 1;
      const teamKey = `team${teamIndex}`;
      newTeams[teamKey].push({ ...player, id: generateId() });
    });
    setTeams(newTeams);
    setWaitingList([]);
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
  const handleDrop = (to: string) => {
    setDragOverTarget(null);
    if (!dragItem.current) return;
    const { player, from } = dragItem.current;
    if (from === to) return;
    if (from === "waiting" && to.startsWith("team")) {
      setWaitingList((prev) => prev.filter((p) => p.id !== player.id));
      setTeams((prev) => ({ ...prev, [to]: [...(prev[to] || []), player] }));
    } else if (from.startsWith("team") && to === "waiting") {
      setTeams((prev) => ({
        ...prev,
        [from]: (prev[from] || []).filter((p) => p.id !== player.id),
      }));
      setWaitingList((prev) => [...prev, player]);
    } else if (from.startsWith("team") && to.startsWith("team")) {
      setTeams((prev) => {
        const newFrom = (prev[from] || []).filter((p) => p.id !== player.id);
        const newTo = [...(prev[to] || []), player];
        return { ...prev, [from]: newFrom, [to]: newTo };
      });
    }
    dragItem.current = null;
  };
  // 뒤로가기 시 모달 닫기
  useEffect(() => {
    if (!isClient) return;
    const handlePopState = () => {
      if (isModalOpen) setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.history.pushState({ modal: true }, "");
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (isModalOpen && window.history.state && window.history.state.modal) {
        window.history.back();
      }
    };
  }, [isModalOpen, isClient]);

  const handleReset = () => {
    setWaitingList([]);
    setTeams(createDefaultTeams());
    setTeamColors(createDefaultTeamColors());
    setSelectedTeamCount(4);
    if (typeof window !== "undefined") {
      localStorage.removeItem("team-waiting-list");
      localStorage.removeItem("team-teams");
      localStorage.removeItem("team-colors");
      localStorage.removeItem("team-selected-count");
    }
  };

  // --- 렌더 함수 ---
  // 대기자 명단 렌더
  const renderWaitingList = () => (
    <div className="flex gap-2">
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
              style={{ marginBottom: "0" }}
              draggable
              onDragStart={() => handleDragStart(player, "waiting")}
            >
              {player.name}
            </div>
          ))}
        </div>
      </div>
      <div
        className={`border border-red-400 rounded p-4 min-h-[100px] bg-red-50 mt-1 w-1/6 flex flex-col items-center justify-center transition-colors duration-150 ${
          dragOverTarget === "delete" ? "bg-red-200" : ""
        }`}
        onDragOver={(e) => handleDragOver(e, "delete")}
        onDragLeave={() => handleDragLeave("delete")}
        onDrop={() => {
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
          dragItem.current = null;
        }}
      >
        <span className="text-red-500 font-semibold text-sm">
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
        </span>
      </div>
    </div>
  );
  // 팀 리스트 렌더
  const renderTeams = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
      {Array.from({ length: TEAM_COUNT }).map((_, idx) => {
        const teamKey = `team${idx + 1}`;
        const teamPlayers = teams[teamKey] || [];
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
              className="text-md font-semibold mb-2 cursor-pointer hover:opacity-80 transition-opacity px-2 py-1 rounded"
              style={{ backgroundColor: teamColors[teamKey] || "transparent" }}
              onClick={() => handleTeamColorChange(teamKey)}
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
                  className="bg-blue-50 modern-border-sm px-3 py-1 cursor-move inline-block"
                  style={{ marginBottom: "0" }}
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
  // 요약 모달 렌더
  const renderSummaryModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Team.</h2>
          <button
            onClick={handleCloseModal}
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
                {Array.from({ length: TEAM_COUNT }).map((_, idx) => {
                  const teamKey = `team${idx + 1}`;
                  const teamPlayers = teams[teamKey] || [];
                  if (teamPlayers.length === 0) return null;
                  return (
                    <th
                      key={teamKey}
                      className="modern-border-sm px-4 py-2 text-center font-semibold"
                      style={{
                        backgroundColor: teamColors[teamKey] || "#f3f4f6",
                      }}
                    >{`팀 ${idx + 1}`}</th>
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
                    {Array.from({ length: TEAM_COUNT }).map((_, idx) => {
                      const teamKey = `team${idx + 1}`;
                      const teamPlayers = teams[teamKey] || [];
                      if (teamPlayers.length === 0) return null;
                      const player = teamPlayers[rowIndex];
                      return (
                        <td
                          key={`${teamKey}-${rowIndex}`}
                          className="modern-border-sm px-4 py-2 text-center"
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

  // --- 메인 렌더 ---
  return (
    <div className="p-6 max-w-[920px] mx-auto">
      {!isClient ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-gray-500">로딩 중...</div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl">Team</h1>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition"
                  onClick={handleReset}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col w-full">
            <textarea
              className="modern-border p-2 mb-2 resize-y min-h-[80px]"
              placeholder="여러 명의 선수를 한 줄에 한 명씩 입력하세요."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
            />
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              onClick={handleAddPlayers}
            >
              선수추가
            </button>
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h1 className="text-lg">대기자 명단</h1>
                <div>
                  <div className="flex items-center gap-2">
                    <select
                      className="modern-border-sm p-2"
                      value={selectedTeamCount}
                      onChange={(e) =>
                        setSelectedTeamCount(Number(e.target.value))
                      }
                    >
                      <option value={2}>2개팀</option>
                      <option value={3}>3개팀</option>
                      <option value={4}>4개팀</option>
                    </select>
                    <button
                      type="button"
                      className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700 transition"
                      onClick={handleRandomAssignment}
                    >
                      랜덤 배정
                    </button>
                  </div>
                </div>
              </div>
              {renderWaitingList()}
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <h1 className="text-lg">팀 선정</h1>
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700 transition"
                      onClick={handleSummaryView}
                    >
                      Result
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {renderTeams()}
          </div>
          {isModalOpen && renderSummaryModal()}
        </>
      )}
    </div>
  );
}
