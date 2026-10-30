import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
const root = document.getElementById("root");
const language = document.documentElement.lang === "es" ? "es" : "en";
const app = (
  <StrictMode>
    <App language={language} />
  </StrictMode>
);
if (root.children.length) hydrateRoot(root, app);
else createRoot(root).render(app);
