import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "./styles/glass.css";
import App from "./App.jsx";
import { ThemeProvider } from "./app/ThemeContext.jsx";
import { ViewProvider } from "./app/ViewContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ViewProvider>
        <App />
      </ViewProvider>
    </ThemeProvider>
  </React.StrictMode>
);
