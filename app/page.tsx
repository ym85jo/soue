"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/todo";
  }, []);
  return <div className="container"></div>;
}
