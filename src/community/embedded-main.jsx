import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "../App.jsx";
import { setDraftStorage } from "./draft.mjs";
import { startPageRuntime } from "../../shared/community-page.mjs";

const seed = window.__COMMUNITY_EMBED__;
delete window.__COMMUNITY_EMBED__;
const send = (data) => parent.postMessage(data, "*");
const drafts = new Map(
  Object.entries(seed.drafts || {}).map(([zone, strokes]) => [
    "community-drawing-draft-v1:" + zone,
    JSON.stringify({ at: Date.now(), strokes }),
  ]),
);
setDraftStorage({
  getItem: (key) => drafts.get(key) || null,
  setItem(key, value) {
    drafts.set(key, value);
    send({
      type: "community-page-draft",
      zone: key.slice("community-drawing-draft-v1:".length),
      strokes: JSON.parse(value).strokes,
    });
  },
  removeItem(key) {
    drafts.delete(key);
    send({
      type: "community-page-draft",
      zone: key.slice("community-drawing-draft-v1:".length),
      strokes: [],
    });
  },
});
const root = createRoot(document.getElementById("community-root"));
export function EmbeddedPortfolio() {
  const [scene, setScene] = React.useState(seed.scene);
  const [saving, setSaving] = React.useState(seed.saving);
  React.useEffect(() => {
    const update = (event) => {
      if (event.source !== parent) return;
      if (event.data?.type === "community-scene-update")
        setScene({ ...event.data.scene, program: null });
      if (event.data?.type === "community-saving-update")
        setSaving(event.data.saving === true);
    };
    addEventListener("message", update);
    startPageRuntime({
      source: seed.program.javascript,
      extra: seed.program.html,
      viewportHeight: seed.viewportHeight,
      language: seed.language,
      nativeApp: true,
      api: {
        React,
        createRoot,
        replacePage(html = "") {
          // Stop React cleanly before replacing the entire public document.
          return new Promise((resolve) =>
            queueMicrotask(() => {
              root.unmount();
              document.body.innerHTML = html;
              resolve();
            }),
          );
        },
      },
    });
    return () => removeEventListener("message", update);
  }, []);
  const onDrawing = React.useCallback(
    (drawing) => send({ type: "community-page-drawing", drawing }),
    [],
  );
  return (
    <App
      initialContent={seed.content}
      communityScene={{ ...scene, program: null }}
      language={seed.language}
      communityEmbedded
      embeddedSaving={saving}
      onEmbeddedDrawing={onDrawing}
    />
  );
}
root.render(<EmbeddedPortfolio />);
