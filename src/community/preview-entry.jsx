import { renderToStaticMarkup } from "react-dom/server";
import App from "../App.jsx";
export function renderPreview(content, scene, language) {
  return renderToStaticMarkup(
    <App
      language={language}
      initialContent={content}
      communityScene={scene}
      communityPreview
    />,
  );
}
