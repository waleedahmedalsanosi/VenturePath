"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Initialize from <html data-theme="..."> set by the pre-paint bootstrap,
    // or fall back to the OS preference.
    const fromAttr = document.documentElement.getAttribute("data-theme");
    if (fromAttr === "light" || fromAttr === "dark") {
      setTheme(fromAttr);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("venturepath-theme", next);
    } catch {
      // localStorage may be disabled; the attribute is still applied per-tab.
    }
    setTheme(next);
  }

  if (theme === null) {
    // Avoid flash mismatch — render a placeholder same width during hydration.
    return <span className="inline-block h-6 w-12" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-sm px-2 py-1 text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface) tabular-nums"
    >
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
