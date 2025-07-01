"use client";

import { useEffect, useState } from "react";

export default function RandomPicker() {
  const [inputValue, setInputValue] = useState("");
  const [itemList, setItemList] = useState<string[]>([]);
  const [pickCount, setPickCount] = useState(1);
  const [result, setResult] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 로컬스토리지에서 불러오기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedList = localStorage.getItem("random-items");
      const savedCount = localStorage.getItem("random-pick-count");
      setItemList(savedList ? JSON.parse(savedList) : []);
      setPickCount(savedCount ? Number(savedCount) : 1);
    }
  }, []);

  // 로컬스토리지에 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("random-items", JSON.stringify(itemList));
    }
  }, [itemList]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("random-pick-count", pickCount.toString());
    }
  }, [pickCount]);

  const handleDeleteItem = (idx: number) => {
    setItemList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleReset = () => {
    setItemList([]);
    setResult([]);
    setInputValue("");
  };

  const handlePick = () => {
    if (itemList.length === 0 || pickCount < 1) return;
    setIsLoading(true);
    setResult([]);
    setProgress(0);
    const duration = 3000;
    const interval = 30;
    const step = 100 / (duration / interval);
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next > 100 ? 100 : next;
      });
    }, interval);
    setTimeout(() => {
      clearInterval(timer);
      setProgress(100);
      const shuffled = [...itemList].sort(() => Math.random() - 0.5);
      setResult(shuffled.slice(0, pickCount));
      setIsLoading(false);
    }, duration);
  };

  const maxPick = itemList.length > 0 ? itemList.length : 1;

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">제비뽑기</h1>
      <div className="mt-4 flex flex-col w-full">
        {/* 입력 폼 */}
        <form
          className="modern-border p-4 bg-gray-50"
          onSubmit={(e) => {
            e.preventDefault();
            const value = inputValue.trim();
            if (!value) return;
            setItemList((prev) => [...prev, value]);
            setInputValue("");
          }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-1">
            항목을 입력하고 엔터를 눌러 추가하세요
          </label>
          <input
            className="w-full modern-border-sm p-2 mb-2 min-h-[40px]"
            placeholder="ex) 피자 ↩️ 치킨 ↩️ 파스타 ↩️ ..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </form>

        {/* 항목 리스트 */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h1 className="text-lg">항목 목록</h1>
            <button
              type="button"
              className="bg-amber-600 text-white p-2 rounded hover:bg-amber-700 transition"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          {itemList.length === 0 ? (
            <div className="modern-border p-4 bg-gray-50 text-gray-400 text-center mt-2">
              등록된 항목이 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {itemList.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white modern-border-sm px-3 py-1 flex items-center gap-2"
                >
                  <span>{item}</span>
                  <button
                    className="text-red-400 hover:text-red-700 text-base px-1"
                    title="삭제"
                    onClick={() => handleDeleteItem(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 뽑기 설정 및 버튼 */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="font-medium">몇 개를 뽑을까요?</label>
            <select
              className="modern-border-sm p-2"
              value={pickCount}
              onChange={(e) => setPickCount(Number(e.target.value))}
            >
              {Array.from({ length: maxPick }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}개
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={`bg-blue-600 text-white px-4 py-2 rounded transition
              hover:bg-blue-700
              ${
                isLoading || itemList.length === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
            onClick={handlePick}
            disabled={itemList.length === 0 || isLoading}
          >
            {isLoading ? "로딩 중..." : "뽑기"}
          </button>
        </div>

        {/* 결과 표시 */}
        {isLoading && (
          <div className="mt-8 w-full flex flex-col items-center">
            <div className="w-1/2 h-2 bg-gray-200 rounded overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="ml-2 text-blue-600 font-semibold mt-2">
              결과를 준비 중입니다... ({Math.round(progress)}%)
            </span>
          </div>
        )}
        {result.length > 0 && !isLoading && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">결과</h2>
            <div className="flex flex-wrap gap-3">
              {result.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 modern-border px-4 py-2 text-blue-800 font-bold text-lg shadow"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
