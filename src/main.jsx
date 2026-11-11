import React from "react";
import { createRoot } from "react-dom/client";
import { Workspace } from "./Workspace.tsx";
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/inria-serif/latin-400.css';
import "./studio.css";
import "./usability.css";
import "./setup.css";
import "./features.css";
import "./concierge.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Workspace />
  </React.StrictMode>,
);
