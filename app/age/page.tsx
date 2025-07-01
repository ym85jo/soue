"use client";

import { useEffect, useState } from "react";

export default function AgePage() {
  const [birth, setBirth] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [daysToBirthday, setDaysToBirthday] = useState<number | null>(null);

  // 로컬 스토리지에서 값 불러오기
  useEffect(() => {
    const savedBirth = localStorage.getItem("birth");
    if (savedBirth) {
      setBirth(savedBirth);
      setAge(calcAge(savedBirth));
      setDaysToBirthday(calcDaysToBirthday(savedBirth));
    } else {
      const defaultBirth = "1990-01-01";
      setBirth(defaultBirth);
      setAge(calcAge(defaultBirth));
      setDaysToBirthday(calcDaysToBirthday(defaultBirth));
    }
  }, []);

  // 만나이 계산 함수
  function calcAge(birthStr: string) {
    const today = new Date();
    const birthDate = new Date(birthStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // 다음 생일까지 남은 일수 계산 함수
  function calcDaysToBirthday(birthStr: string) {
    const today = new Date();
    const birthDate = new Date(birthStr);
    const thisYear = today.getFullYear();
    let nextBirthday = new Date(
      thisYear,
      birthDate.getMonth(),
      birthDate.getDate()
    );
    if (
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() > birthDate.getDate())
    ) {
      nextBirthday = new Date(
        thisYear + 1,
        birthDate.getMonth(),
        birthDate.getDate()
      );
    }
    const diffTime = nextBirthday.getTime() - today.setHours(0, 0, 0, 0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 입력 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirth(e.target.value);
  };

  // 계산 및 저장
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birth) return;
    localStorage.setItem("birth", birth);
    setAge(calcAge(birth));
    setDaysToBirthday(calcDaysToBirthday(birth));
  };

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">만나이 계산기</h1>
      <div className="mt-4 flex flex-col w-full">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-white p-6 modern-border-lg shadow"
        >
          <label className="font-semibold">생년월일을 입력하세요</label>
          <input
            type="date"
            value={birth}
            onChange={handleChange}
            className="modern-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            만나이 계산
          </button>
        </form>
        {age !== null && (
          <div className="mt-6 text-center text-lg font-medium">
            만나이: <span className="text-blue-600">{age}세</span>
            {daysToBirthday !== null && (
              <div className="mt-2 text-gray-600 text-base">
                {daysToBirthday === 0
                  ? "오늘 생일입니다! 한 살이 더해졌어요."
                  : `${daysToBirthday}일 후 한 살이 더해집니다.`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
