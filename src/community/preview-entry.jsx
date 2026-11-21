import { renderToStaticMarkup } from "react-dom/server";
import App from "../App.jsx";
export function renderPreview(
  content,
  scene,
  language,
  { editableSource = false } = {},
) {
  return renderToStaticMarkup(
    <App
      language={language}
      initialContent={content}
      communityScene={scene}
      communityPreview={!editableSource}
      communityEmbedded={editableSource}
    />,
  );
}
