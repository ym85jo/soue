"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { useLocalStorage } from "@/lib/useLocalStorage";

// 선수 타입
interface Player {
  id: string;
  name: string;
}

// 배경색 배열을 회색과 노란색 두 가지로 변경
const BACKGROUND_COLORS = ["#949aa7", "#cfff61"];
const MAX_TEAM_COUNT = 6;

function createDefaultTeams(teamCount: number) {
  const obj: { [key: string]: Player[] } = {};
  for (let i = 1; i <= teamCount; i++) obj[`team${i}`] = [];
  return obj;
}

function createDefaultTeamColors(teamCount: number) {
  const obj: { [key: string]: string } = {};
  for (let i = 1; i <= teamCount; i++) obj[`team${i}`] = BACKGROUND_COLORS[0];
  return obj;
}

function getToday() {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

export default function Team6Page() {
  const [textareaValue, setTextareaValue] = useState("");
  const [waitingList, setWaitingList] = useLocalStorage<Player[]>(
    "team6-waiting-list",
    []
  );
  const [teams, setTeams] = useLocalStorage<{ [key: string]: Player[] }>(
    "team6-teams",
    createDefaultTeams(MAX_TEAM_COUNT)
  );
  const [teamColors, setTeamColors] = useLocalStorage<{
    [key: string]: string;
  }>("team6-team-colors", createDefaultTeamColors(MAX_TEAM_COUNT));
  const dragItem = useRef<{
    player: Player;
    from: string;
    index: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [teamCount, setTeamCount] = useLocalStorage<number>(
    "team6-team-count",
    2
  );
  const [showShortNames, setShowShortNames] = useState(false);
  const [boldPlayers, setBoldPlayers] = useState<Set<string>>(new Set());

  const getTeamHeaderStyle = (teamKey: string) => ({
    backgroundColor: teamColors[teamKey] || "transparent",
    color: ["#949aa7", "#f35b10"].includes(teamColors[teamKey])
      ? "#fff"
      : undefined,
  });

  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (showSummaryModal) {
        event.preventDefault();
        setShowSummaryModal(false);
        window.history.pushState(null, "", window.location.pathname);
      }
    };

    if (showSummaryModal) {
      window.history.pushState(null, "", window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showSummaryModal]);

  const handleTeamColorChange = (teamKey: string) => {
    setTeamColors((prev) => {
      const currentIdx = BACKGROUND_COLORS.indexOf(
        prev[teamKey] || BACKGROUND_COLORS[0]
      );
      const nextIdx = (currentIdx + 1) % BACKGROUND_COLORS.length;
      return { ...prev, [teamKey]: BACKGROUND_COLORS[nextIdx] };
    });
    toast.success(`${teamKey} 팀 색상이 변경되었습니다.`);
  };

  const handleRandomAssignment = () => {
    const allPlayers = [...waitingList, ...Object.values(teams).flat()];
    if (allPlayers.length === 0) return;
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    const newTeams = createDefaultTeams(MAX_TEAM_COUNT);
    shuffled.forEach((player, idx) => {
      const teamIdx = (idx % teamCount) + 1;
      const teamKey = `team${teamIdx}`;
      newTeams[teamKey].push({ ...player, id: generateId() });
    });
    setTeams(newTeams);
    setWaitingList([]);
    toast.success(`${teamCount}개 팀으로 랜덤 배정이 완료되었습니다.`);
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      if (!window.confirm("정말 초기화하시겠습니까? 모든 데이터가 삭제됩니다."))
        return;
    }
    setWaitingList([]);
    setTeams(createDefaultTeams(MAX_TEAM_COUNT));
    setTeamColors(createDefaultTeamColors(MAX_TEAM_COUNT));
    setTeamCount(2);
    if (typeof window !== "undefined") {
      localStorage.removeItem("team6-waiting-list");
      localStorage.removeItem("team6-teams");
      localStorage.removeItem("team6-team-colors");
      localStorage.removeItem("team6-team-count");
    }
    toast.success("모든 데이터가 초기화되었습니다.");
  };

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
    const newPlayers: Player[] = names.map((name) => ({
      id: generateId(),
      name,
    }));
    setWaitingList((prev) => [...prev, ...newPlayers]);
    setTextareaValue("");
    toast.success(`${names.length}명의 선수가 대기자 명단에 추가되었습니다.`);
  };

  const handleDragStart = (player: Player, from: string, index: number) => {
    dragItem.current = { player, from, index };
  };

  const handleDragOver = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    setDragOverTarget(target);
  };

  const handleDragLeave = (target: string) => {
    if (dragOverTarget === target) setDragOverTarget(null);
  };

  const handleDrop = (to: string, toIndex?: number) => {
    setDragOverTarget(null);
    if (!dragItem.current) return;
    const { player, from, index } = dragItem.current;

    if (from === to) {
      if (toIndex === undefined || index === toIndex) return;

      if (from === "waiting") {
        const newWaitingList = [...waitingList];
        const [movedPlayer] = newWaitingList.splice(index, 1);
        newWaitingList.splice(toIndex, 0, movedPlayer);
        setWaitingList(newWaitingList);
      } else if (from.startsWith("team")) {
        setTeams((prev) => {
          const newTeam = [...(prev[from] || [])];
          const [movedPlayer] = newTeam.splice(index, 1);
          newTeam.splice(toIndex, 0, movedPlayer);
          return { ...prev, [from]: newTeam };
        });
      }
      return;
    }

    if (from === "waiting" && to.startsWith("team")) {
      setWaitingList((prev) => prev.filter((p) => p.id !== player.id));
      setTeams((prev) => {
        const newTeam = [...(prev[to] || [])];
        if (toIndex !== undefined) {
          newTeam.splice(toIndex, 0, player);
        } else {
          newTeam.push(player);
        }
        return { ...prev, [to]: newTeam };
      });
      toast.success(
        `${player.name} 선수가 팀 ${to.replace("team", "")}에 추가되었습니다.`
      );
    } else if (from.startsWith("team") && to === "waiting") {
      setTeams((prev) => ({
        ...prev,
        [from]: (prev[from] || []).filter((p) => p.id !== player.id),
      }));
      setWaitingList((prev) => [...prev, player]);
      toast.success(`${player.name} 선수가 대기자 명단으로 이동되었습니다.`);
    } else if (from.startsWith("team") && to.startsWith("team")) {
      setTeams((prev) => {
        const newFrom = (prev[from] || []).filter((p) => p.id !== player.id);
        const newTo = [...(prev[to] || [])];
        if (toIndex !== undefined) {
          newTo.splice(toIndex, 0, player);
        } else {
          newTo.push(player);
        }
        return { ...prev, [from]: newFrom, [to]: newTo };
      });
      toast.success(
        `${player.name} 선수가 팀 ${from.replace(
          "team",
          ""
        )}에서 팀 ${to.replace("team", "")}로 이동되었습니다.`
      );
    }
    dragItem.current = null;
  };

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
    toast.success(`${player.name} 선수가 영구적으로 삭제되었습니다.`);
    dragItem.current = null;
  };

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
          {waitingList.map((player, index) => (
            <div
              key={player.id}
              className="bg-white border rounded px-3 py-1 cursor-move inline-block"
              draggable
              onDragStart={() => handleDragStart(player, "waiting", index)}
              onDragOver={(e) => handleDragOver(e, "waiting")}
              onDrop={() => handleDrop("waiting", index)}
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
      {Array.from({ length: MAX_TEAM_COUNT }).map((_, idx) => {
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
              {teamPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-blue-50 modern-border-sm px-2 py-1 cursor-move inline-block"
                  draggable
                  onDragStart={() => handleDragStart(player, teamKey, index)}
                  onDragOver={(e) => handleDragOver(e, teamKey)}
                  onDrop={() => handleDrop(teamKey, index)}
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

  const handleSummaryView = () => {
    const hasPlayers = Object.values(teams).some((team) => team.length > 0);
    if (hasPlayers) {
      setShowSummaryModal(true);
      window.history.pushState(null, "", window.location.pathname);
    }
  };
  const handleCloseSummaryModal = () => {
    setShowSummaryModal(false);
    setBoldPlayers(new Set()); // 볼드 상태 초기화
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handlePlayerDoubleClick = (playerId: string) => {
    setBoldPlayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const renderSummaryModal = () => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
      onClick={handleCloseSummaryModal}
    >
      <div
        className="bg-white rounded-lg p-4 max-w-[520px] mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            300FC
            <span
              className="text-sm ml-1"
              style={{ fontWeight: "normal", color: "gray" }}
            >
              {getToday()}
            </span>
            <div className=" ml-2 inline-block">
              <div className="flex gap-1 align-middle text-sm">
                <label className="cursor-pointer">
                  <input type="checkbox" className="peer hidden" />
                  <span className="flex items-center justify-center border rounded px-2 bg-gray-100 text-gray-800 peer-checked:bg-green-300 peer-checked:text-black peer-checked:font-semibold">
                    2-2
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="checkbox" className="peer hidden" />
                  <span className="flex items-center justify-center border rounded px-2 bg-gray-100 text-gray-800 peer-checked:bg-green-300 peer-checked:text-black peer-checked:font-semibold">
                    2-1
                  </span>
                </label>
                |
                <label className="cursor-pointer">
                  <input type="checkbox" className="peer hidden" />
                  <span className="flex items-center justify-center border rounded px-2 bg-gray-100 text-gray-800 peer-checked:bg-green-300 peer-checked:text-black peer-checked:font-semibold">
                    1-2
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="checkbox" className="peer hidden" />
                  <span className="flex items-center justify-center border rounded px-2 bg-gray-100 text-gray-800 peer-checked:bg-green-300 peer-checked:text-black peer-checked:font-semibold">
                    1-1
                  </span>
                </label>
              </div>
            </div>
          </h2>
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
                {Array.from({ length: MAX_TEAM_COUNT }).map((_, idx) => {
                  const teamKey = `team${idx + 1}`;
                  const teamPlayers = teams[teamKey] || [];
                  if (teamPlayers.length === 0) return null;
                  return (
                    <th
                      key={teamKey}
                      className="modern-border-sm px-2 py-2 text-center font-semibold cursor-pointer"
                      style={{
                        ...getTeamHeaderStyle(teamKey),
                        borderRadius: 0,
                      }}
                      onClick={() => handleTeamColorChange(teamKey)}
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
                    {Array.from({ length: MAX_TEAM_COUNT }).map((_, idx) => {
                      const teamKey = `team${idx + 1}`;
                      const teamPlayers = teams[teamKey] || [];
                      if (teamPlayers.length === 0) return null;
                      const player = teamPlayers[rowIndex];
                      return (
                        <td
                          key={`${teamKey}-${rowIndex}`}
                          className="modern-border-sm px-4 py-2 text-center text-xs"
                        >
                          {player ? (
                            <span
                              className={`cursor-pointer select-none ${
                                boldPlayers.has(player.id)
                                  ? "bg-yellow-300 text-black px-1 rounded"
                                  : ""
                              }`}
                              onDoubleClick={() =>
                                handlePlayerDoubleClick(player.id)
                              }
                              title="더블클릭하여 볼드 표시 토글"
                            >
                              {showShortNames
                                ? player.name.substring(0, 3)
                                : player.name}
                            </span>
                          ) : (
                            ""
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        <div className="flex mt-2 justify-end">
          <div className="flex items-center text-xs">
            <input
              type="checkbox"
              id="short-name-checkbox"
              className="mr-1"
              checked={showShortNames}
              onChange={(e) => setShowShortNames(e.target.checked)}
            />
            <label
              htmlFor="short-name-checkbox"
              className="select-none cursor-pointer"
            >
              3글자만 표시
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">300FC</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700 transition"
            onClick={handleReset}
          >
            RESET
          </button>
        </div>
      </div>
      <div className="flex flex-col w-full mt-2">
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
          선수 추가
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
                  className="modern-border-sm p-1 w-full"
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                >
                  <option value={1}>1개팀</option>
                  <option value={2}>2개팀</option>
                  <option value={3}>3개팀</option>
                  <option value={4}>4개팀</option>
                  <option value={5}>5개팀</option>
                  <option value={6}>6개팀</option>
                </select>
              </div>

              <button
                type="button"
                className="bg-gray-600 text-white px-2 py-0 rounded hover:bg-gray-700 transition"
                onClick={handleRandomAssignment}
              >
                RANDOM
              </button>
            </div>
          </div>
        </div>
        {renderWaitingList()}
        <hr className="my-6 border-t border-gray-200" />
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-lg">TEAM SETUP</h1>
            <div>
              <button
                type="button"
                className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition"
                onClick={handleSummaryView}
              >
                RESULT
              </button>
            </div>
          </div>
          {renderTeams()}
        </div>
      </div>
      {showSummaryModal && renderSummaryModal()}
    </div>
  );
}
