"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const enabled = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", enabled);
    setIsDark(enabled);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="px-3 py-1 rounded border text-sm"
      aria-label="Toggle dark mode"
      title="Toggle theme"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}


