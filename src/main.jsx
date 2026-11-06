import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
const root = document.getElementById("root");
const language = document.documentElement.lang === "es" ? "es" : "en";
const isAdmin = /^\/admin\/?$/.test(window.location.pathname);
const app = (
  <StrictMode>
    <App language={language} />
  </StrictMode>
);
if (isAdmin) {
  document.documentElement.lang = "es";
  document.title = "Editar portfolio · Pablo Carvalho";
  import("./Admin.jsx").then(({ default: Admin }) =>
    createRoot(root).render(<Admin />),
  );
} else if (root.children.length) hydrateRoot(root, app);
else createRoot(root).render(app);
