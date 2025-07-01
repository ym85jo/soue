"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // 페이지 로드 시 team 페이지로 리다이렉트
    window.location.href = "/team";
  }, []);
  return <div className="container"></div>;
}
