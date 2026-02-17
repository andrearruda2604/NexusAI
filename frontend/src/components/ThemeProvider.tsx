"use client";

import { useEffect } from "react";

function getSystemTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: string) {
    if (typeof document === "undefined") return;
    const resolved = theme === "system" ? getSystemTheme() : theme;
    document.documentElement.setAttribute("data-theme", resolved);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Load theme from localStorage first (instant, no flash)
        const saved = localStorage.getItem("nexus-theme") || "light";
        applyTheme(saved);

        // Listen for system theme changes when "system" is selected
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const current = localStorage.getItem("nexus-theme");
            if (current === "system") {
                applyTheme("system");
            }
        };
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return <>{children}</>;
}
