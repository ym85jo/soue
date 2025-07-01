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
