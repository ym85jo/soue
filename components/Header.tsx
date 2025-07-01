"use client";

import Link from "next/link";
import { useMemo } from "react";

export default function Header() {
  const closeMobileMenu = () => {
    const menu = document.getElementById("mobile-menu");
    if (menu) {
      menu.classList.add("hidden");
      menu.classList.remove("flex");
    }
  };

  const clickMenu = () => {
    closeMobileMenu();
  };

  // 메뉴 항목을 JSON 배열로 관리
  const menuItems = useMemo(
    () => [
      { label: "Team", href: "/team" },
      { label: "D-Day", href: "/dday" },
      { label: "나이 계산기", href: "/age" },
      { label: "제비 뽑기", href: "/random" },
      { label: "할 일", href: "/todo" },
    ],
    []
  );

  return (
    <header className="bg-gray-600 text-white p-4 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center max-w-[920px]">
        <Link href="/" className="text-2xl font-bold" onClick={clickMenu}>
          Yeongmin.
        </Link>
        {/* 햄버거 메뉴 버튼 */}
        <button
          type="button"
          className="flex flex-col justify-center items-center w-10 h-10 ml-auto focus:outline-none"
          aria-label="메뉴 열기"
          onClick={() => {
            const menu = document.getElementById("mobile-menu");
            if (menu) {
              menu.classList.toggle("hidden");
              menu.classList.toggle("flex");
            }
          }}
        >
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white mb-1"></span>
          <span className="block w-6 h-0.5 bg-white"></span>
        </button>
        {/* 모바일 메뉴 */}
        <div
          id="mobile-menu"
          className="absolute top-full left-0 w-full bg-gray-700 text-white hidden flex-col items-center py-4"
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 px-4 w-full text-center hover:bg-gray-500"
              onClick={clickMenu}
            >
              {item.label}
            </Link>
          ))}
          {/* 추가 메뉴 항목은 여기에 */}
        </div>
      </nav>
    </header>
  );
}
