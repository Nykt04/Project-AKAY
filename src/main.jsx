import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import '@fontsource/inria-serif/400.css';
import "./styles.css";
import "./concierge.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
