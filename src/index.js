import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import QuickReplyView from "./QuickReplyView";

// Route ultra-légère chargée par la bulle de notification Android (voir
// android/app/src/main/java/com/serviceimperial/app/BubbleMessagingService.java) — ne monte
// jamais l'app complète, juste un fil de discussion Mushtagram minimal.
const isQuickReply = window.location.pathname === "/quick-reply";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {isQuickReply ? <QuickReplyView /> : <App />}
  </React.StrictMode>
);
