"use client";

import React, { useState, useEffect } from "react";

type DDayEvent = {
  id: string;
  title: string;
  date: string;
  type: "before" | "after"; // before: D-day, after: D+day
};

function generateId() {
  // 서버 사이드에서는 일관된 ID를 생성하지 않도록 함
  if (typeof window === "undefined") {
    return "temp-id-" + Math.random().toString(36).substring(2, 15);
  }

  return (
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 15)
  );
}

// 로컬 스토리지에서 데이터를 안전하게 로드하는 함수
function loadFromStorage(): DDayEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedEvents = localStorage.getItem("dday-events");
    return savedEvents ? JSON.parse(savedEvents) : [];
  } catch (error) {
    console.error(
      "로컬 스토리지에서 데이터를 불러오는 중 오류가 발생했습니다:",
      error
    );
    return [];
  }
}

// D-day 계산 함수
function calculateDDay(targetDate: string): {
  days: number;
  type: "before" | "after";
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { days: diffDays, type: "before" };
  } else if (diffDays < 0) {
    return { days: Math.abs(diffDays), type: "after" };
  } else {
    return { days: 0, type: "before" };
  }
}

// 날짜 유효성 검사 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export default function DDay() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState<DDayEvent[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [todayString, setTodayString] = useState("");

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
    setEvents(loadFromStorage());
    setTodayString(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    );
  }, []);

  // 이벤트가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (isClient && events.length > 0) {
      localStorage.setItem("dday-events", JSON.stringify(events));
    }
  }, [events, isClient]);

  // 이벤트 추가
  const handleAddEvent = () => {
    if (!title.trim() || !date.trim()) return;

    if (!isValidDate(date)) {
      alert("올바른 날짜를 입력해주세요.");
      return;
    }

    const newEvent: DDayEvent = {
      id: generateId(),
      title: title.trim(),
      date: date,
      type: "before",
    };

    setEvents((prev) => [...prev, newEvent]);
    setTitle("");
    setDate("");
  };

  // 이벤트 삭제
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">D-day</h1>

      <div className="mt-4 flex flex-col w-full">
        {/* 입력 폼 */}
        <div className="modern-border p-4 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <input
                type="text"
                className="w-full modern-border-sm p-2"
                placeholder="이벤트 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEvent()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜
              </label>
              <input
                type="date"
                className="w-full modern-border-sm p-2"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddEvent()}
              />
            </div>
          </div>
          <button
            type="button"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            onClick={handleAddEvent}
          >
            이벤트 추가
          </button>
        </div>

        {/* D-day 목록 */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h1 className="text-lg">D-day 목록</h1>
            <div className="text-sm text-gray-500">
              총 {isClient ? events.length : 0}개의 이벤트
            </div>
          </div>

          <div className="mt-2">
            {!isClient || events.length === 0 ? (
              <div className="modern-border p-4 bg-gray-50 text-gray-400 text-center">
                {!isClient ? "로딩 중..." : "등록된 D-day가 없습니다."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events
                  .slice() // 원본 배열 변경 방지
                  .sort((a, b) => {
                    const aResult = calculateDDay(a.date);
                    const bResult = calculateDDay(b.date);
                    // 다가올 D-day는 days 오름차순, 이미 지난 D-day는 그 다음에 오도록
                    if (aResult.type === bResult.type) {
                      return aResult.days - bResult.days;
                    }
                    // 다가올 D-day가 먼저, 지난 D-day가 뒤로
                    return aResult.type === "before" ? -1 : 1;
                  })
                  .map((event) => {
                    const { days, type } = calculateDDay(event.date);
                    const isToday = days === 0;

                    return (
                      <div
                        key={event.id}
                        className="modern-border bg-white hover:shadow-md transition-shadow flex flex-row items-center gap-2 px-3 py-2 min-h-[44px]"
                      >
                        {/* D-day 표시 */}
                        <div
                          className={`font-bold text-base min-w-[60px] text-center ${
                            isToday
                              ? "text-green-600"
                              : type === "before"
                              ? "text-blue-700"
                              : "text-orange-700"
                          }`}
                        >
                          {isToday
                            ? "D-day"
                            : type === "before"
                            ? `D-${days}`
                            : `D+${days}`}
                        </div>
                        {/* 제목 */}
                        <div className="flex-1 truncate text-sm font-medium px-2">
                          {event.title}
                        </div>
                        {/* 날짜 */}
                        <div className="text-xs text-gray-500 min-w-[90px] text-right">
                          {event.date}
                        </div>
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-400 hover:text-red-700 text-base ml-2 px-1"
                          title="삭제"
                          style={{ lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 오늘 날짜 표시 */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500">
            오늘: {isClient ? todayString : "로딩 중..."}
          </div>
        </div>
      </div>
    </div>
  );
}
