import { api as communityApi } from "./request.mjs";
import { contactPayload, deliverContact } from "../contact.mjs";
import { useEffect, useMemo, useRef } from "react";
import { nativePageDocument } from "../../shared/community-page.mjs";
import { drawingEnabled } from "../../shared/community-catalog.mjs";
import { loadDraft, saveDraft, fingerprint } from "./draft.mjs";
export default function PageProgram({
  program,
  content,
  language,
  scene,
  saving,
  onDrawing,
  onClear,
}) {
  const frame = useRef(null),
    contact = useRef({ pending: false, at: 0 });
  const current = useRef({ scene, saving, onDrawing, onClear });
  current.current = { scene, saving, onDrawing, onClear };
  const identity = JSON.stringify({ program, content, language });
  const source = useMemo(() => {
    const seed = JSON.parse(identity);
    const zones = [
      "hero",
      "work",
      "contact",
      "portrait",
      "page",
      ...seed.content.projects.map((p) => "project:" + p.id),
    ];
    const drafts = Object.fromEntries(
      zones
        .map((zone) => [zone, loadDraft(zone)])
        .filter(([, strokes]) => strokes.length),
    );
    const styles = [...document.styleSheets]
      .map((sheet) => {
        try {
          return [...sheet.cssRules].map((r) => r.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");
    return nativePageDocument(seed.program, {
      ...seed,
      scene: current.current.scene,
      saving: current.current.saving,
      drafts,
      styles,
      base: location.origin,
      viewportHeight: innerHeight,
    });
  }, [identity]);
  useEffect(() => {
    const root = frame.current?.closest(".portfolio");
    let initialized = false;
    async function message(event) {
      if (event.source !== frame.current?.contentWindow) return;
      const d = event.data;
      if (!d || typeof d !== "object") return;
      if (["community-page-draft", "community-page-drawing"].includes(d.type)) {
        const draft = d.type === "community-page-drawing" ? d.drawing : d;
        if (
          !draft ||
          (!["hero", "work", "contact", "portrait", "page"].includes(
            draft.zone,
          ) &&
            !/^project:[a-z0-9-]{1,80}$/.test(draft.zone || ""))
        )
          return;
        if (!drawingEnabled(current.current.scene, draft.zone)) return;
        try {
          if (d.type === "community-page-draft") {
            saveDraft(draft.zone, draft.strokes);
            if (Array.isArray(draft.strokes) && !draft.strokes.length)
              current.current.onClear?.(draft.zone);
          } else {
            fingerprint(draft);
            current.current.onDrawing({
              zone: draft.zone,
              strokes: draft.strokes,
            });
          }
        } catch {
          /* Invalid numeric data never reaches persistence. */
        }
        return;
      }
      if (
        d.type === "community-page-language" &&
        ["/", "/es/"].includes(d.path) &&
        navigator.userActivation?.isActive
      ) {
        location.assign(d.path);
        return;
      }
      if (d.type === "community-page-data") {
        const payload = d.data;
        if (
          typeof d.id !== "string" ||
          d.id.length > 40 ||
          !payload ||
          !/^[a-z][a-z0-9_-]{0,47}$/.test(payload.key || "")
        )
          return;
        try {
          const result =
            payload.op === "get"
              ? await communityApi(
                  "/api/community/data?key=" + encodeURIComponent(payload.key),
                )
              : await communityApi("/api/community/data", {
                  method: "POST",
                  body: JSON.stringify({
                    id: d.id,
                    key: payload.key,
                    op: payload.op,
                    value: payload.value ?? null,
                  }),
                });
          event.source.postMessage(
            { type: "community-data-result", id: d.id, value: result.value },
            "*",
          );
        } catch (error) {
          event.source.postMessage(
            {
              type: "community-data-result",
              id: d.id,
              error: [
                "invalid",
                "paused",
                "conflict",
                "capacity",
                "rate_limited",
              ].includes(error.message)
                ? error.message
                : "unavailable",
            },
            "*",
          );
        }
        return;
      }
      if (d.type === "community-page-contact") {
        if (typeof d.id !== "string" || d.id.length > 40) return;
        let ok = false;
        if (
          navigator.userActivation?.isActive &&
          !contact.current.pending &&
          Date.now() - contact.current.at > 30000
        ) {
          contact.current = { pending: true, at: Date.now() };
          try {
            await deliverContact(
              contactPayload(d.data),
              AbortSignal.timeout(20000),
            );
            ok = true;
          } catch {
            /* Keep the form data for retry. */
          } finally {
            contact.current.pending = false;
          }
        }
        event.source.postMessage(
          { type: "community-contact-result", id: d.id, ok },
          "*",
        );
        return;
      }
      if (d.type !== "community-page-size") return;
      const h = d.height;
      if (!Number.isFinite(h) || h < 400 || h > 30000) return;
      frame.current.style.height = h + "px";
      root?.setAttribute("data-community-page-ready", "true");
      if (!initialized) {
        initialized = true;
        frame.current.contentWindow.postMessage(
          { type: "community-scene-update", scene: current.current.scene },
          "*",
        );
        frame.current.contentWindow.postMessage(
          { type: "community-saving-update", saving: current.current.saving },
          "*",
        );
      }
      viewport();
    }
    const viewport = () =>
      frame.current?.contentWindow?.postMessage(
        { type: "community-page-viewport", height: innerHeight, scrollY },
        "*",
      );
    addEventListener("message", message);
    addEventListener("resize", viewport);
    addEventListener("scroll", viewport, { passive: true });
    return () => {
      removeEventListener("message", message);
      removeEventListener("resize", viewport);
      removeEventListener("scroll", viewport);
      root?.removeAttribute("data-community-page-ready");
    };
  }, [source]);
  const sceneKey = JSON.stringify(scene);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "community-scene-update", scene: JSON.parse(sceneKey) },
      "*",
    );
  }, [sceneKey]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "community-saving-update", saving },
      "*",
    );
  }, [saving]);
  return (
    <iframe
      ref={frame}
      className="community-page-frame"
      title={
        language === "es" ? "Portfolio intervenido" : "Community portfolio"
      }
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      referrerPolicy="no-referrer"
      allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'"
      srcDoc={source}
    />
  );
}
