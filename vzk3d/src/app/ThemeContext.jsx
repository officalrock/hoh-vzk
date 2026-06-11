import { createContext, useContext, useEffect } from "react";

// App ist ausschließlich Dark Mode (kein Light Mode, kein Umschalter).
const ThemeContext = createContext({ theme: "dark" });

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.lang = "de";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0e1116");
    try {
      localStorage.removeItem("vzk-theme");
    } catch {
      /* ignore */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme: "dark" }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
