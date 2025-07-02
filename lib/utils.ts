import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
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

// YYYY.MM.DD hh24:mm 형식으로 날짜를 포맷하는 함수
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}
