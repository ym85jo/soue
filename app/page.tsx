"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/team2";
  }, []);
  return <div className="container"></div>;
}
