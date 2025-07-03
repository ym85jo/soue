"use client";

import React, { useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";

// 로또볼 색상 매핑 (공식 색상 참고)
const getLottoColor = (num: number) => {
  if (num <= 10) return "#fbc400"; // 노랑
  if (num <= 20) return "#69c8f2"; // 파랑
  if (num <= 30) return "#ff7272"; // 빨강
  if (num <= 40) return "#aaa"; // 회색
  return "#b0d840"; // 초록
};

// 1~45 중 6개 무작위 추출
function generateLottoNumbers(): number[] {
  const nums = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.slice(0, 6).sort((a, b) => a - b);
}

export default function LottoPage() {
  const [current, setCurrent] = useState<number[]>([]);
  const [history, setHistory] = useLocalStorage<number[][]>(
    "lotto-history",
    []
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 번호 생성 핸들러
  const handleGenerate = () => {
    setLoading(true);
    setCurrent([]); // 로딩 중에는 번호 숨김
    setProgress(0);
    const start = Date.now();
    const duration = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(percent);
      if (percent >= 100) {
        clearInterval(interval);
        const numbers = generateLottoNumbers();
        setCurrent(numbers);
        setHistory((prev) => [numbers, ...prev]);
        setLoading(false);
      }
    }, 30);
  };

  // 이력 삭제
  const handleDelete = (idx: number) => {
    setHistory((prev) => prev.filter((_, i) => i !== idx));
  };

  // 볼 UI
  const LottoBall = ({ num }: { num: number }) => (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md mx-1"
      style={{
        width: 40,
        height: 40,
        backgroundColor: getLottoColor(num),
        border: "2px solid #fff",
      }}
    >
      {num}
    </span>
  );

  // 프로그레스바 UI
  const ProgressBar = () => (
    <div className="w-full mb-4">
      <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-blue-700 select-none"
          style={{ zIndex: 2 }}
        >
          {progress}%
        </span>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">로또번호 생성기</h1>
      <div className="mt-4 flex flex-col w-full">
        {/* 번호 생성 버튼 */}
        <button
          type="button"
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition w-full md:w-auto mb-4 disabled:opacity-60"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "생성 중..." : "번호 생성"}
        </button>

        {/* 로딩 프로그레스바 */}
        {loading && <ProgressBar />}

        {/* 현재 생성된 번호 */}
        {!loading && current.length > 0 && (
          <div className="modern-border bg-white flex flex-row items-center justify-center gap-2 py-4 mb-6">
            {current.map((num) => (
              <LottoBall key={num} num={num} />
            ))}
          </div>
        )}

        <hr className="my-6 border-t border-gray-200" />

        {/* 이력 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg">생성 이력</h2>
            <span className="text-sm text-gray-500">{history.length}회</span>
          </div>
          {history.length === 0 ? (
            <div className="modern-border p-4 bg-gray-50 text-gray-400 text-center">
              생성된 이력이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((nums, idx) => (
                <div
                  key={idx}
                  className="modern-border bg-white flex flex-row items-center justify-between px-3 py-2"
                >
                  <div className="flex flex-row items-center justify-center flex-1">
                    {nums.map((num) => (
                      <LottoBall key={num} num={num} />
                    ))}
                  </div>
                  <button
                    className="text-red-400 hover:text-red-700 text-base ml-2 px-1"
                    title="삭제"
                    onClick={() => handleDelete(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* 프로그레스바 애니메이션용 스타일 */}
      <style>{`
        /* 기존 애니메이션 제거, transition으로 대체 */
      `}</style>
    </div>
  );
}
