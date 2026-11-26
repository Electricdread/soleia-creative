import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorkerAutoUpdate } from "./lib/swAutoUpdate";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* "user" follows the OS reduced-motion setting for every framer-motion
        animation: movement and scale are dropped, opacity changes stay. The
        CSS animations already honour it through the rule in index.css. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </React.StrictMode>
);

registerServiceWorkerAutoUpdate();
