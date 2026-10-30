import { renderToString } from "react-dom/server";
import App from "./App.jsx";
export function render(language = "en") {
  return renderToString(<App language={language} />);
}
