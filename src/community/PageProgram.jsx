import { api as communityApi } from "./request.mjs";
import Canvas from "./Artwork.jsx";
import { contactPayload, deliverContact } from "../contact.mjs";
import { useEffect, useRef, useState } from "react";
import { pageDocument } from "../../shared/community-page.mjs";
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
    contact = useRef({ pending: false, at: 0 }),
    [source, setSource] = useState(""),
    [surfaces, setSurfaces] = useState([]);
  useEffect(() => {
    const root = document.querySelector(".community-original-content");
    if (!root) return;
    const clone = root.cloneNode(true);
    clone
      .querySelectorAll(
        ".community-draw-controls,.community-canvas-hint,.community-strokes,script",
      )
      .forEach((n) => n.remove());
    const parent = root.closest(".portfolio").cloneNode(false);
    parent.removeAttribute("data-community-page");
    parent.removeAttribute("data-community-page-ready");
    parent.append(clone);
    const styles = [...document.styleSheets]
      .map((sheet) => {
        try {
          return [...sheet.cssRules].map((r) => r.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .join("\n");
    setSource(
      pageDocument(program, {
        html: parent.outerHTML,
        styles,
        base: location.origin,
        viewportHeight: innerHeight,
        language,
      }),
    );
  }, [program, content, language]);
  useEffect(() => {
    const root = frame.current?.closest(".portfolio");
    async function message(event) {
      if (event.source !== frame.current?.contentWindow) return;
      const d = event.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "community-page-surfaces") {
        if (!Array.isArray(d.surfaces) || d.surfaces.length > 20) return;
        const valid = d.surfaces.filter(
          (s) =>
            s &&
            typeof s.zone === "string" &&
            (s.zone === "portrait" ||
              /^project:[a-z0-9-]{1,80}$/.test(s.zone)) &&
            ["width", "height", "a", "b", "c", "d", "e", "f"].every(
              (k) => Number.isFinite(s[k]) && Math.abs(s[k]) <= 30000,
            ) &&
            s.width > 0 &&
            s.height > 0 &&
            s.width <= 4000 &&
            s.height <= 4000,
        );
        setSurfaces(valid);
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
      frame.current.contentWindow?.postMessage(
        { type: "community-page-viewport", height: innerHeight, scrollY },
        "*",
      );
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
  const targets = scene?.drawingTargets || [];
  return (
    <>
      <iframe
        ref={frame}
        className="community-page-frame"
        title={
          language === "es" ? "Portfolio intervenido" : "Community portfolio"
        }
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
        referrerPolicy="no-referrer"
        allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'"
        onLoad={() =>
          frame.current?.contentWindow?.postMessage(
            { type: "community-page-ping" },
            "*",
          )
        }
        srcDoc={source || undefined}
      />
      {surfaces
        .filter((s) =>
          s.zone === "portrait"
            ? targets.includes("portrait")
            : targets.includes("projects"),
        )
        .map((s) => (
          <div
            key={s.zone}
            className="community-image-mirror"
            style={{
              width: s.width,
              height: s.height,
              transform: `matrix(${s.a},${s.b},${s.c},${s.d},${s.e + (frame.current?.offsetLeft || 0)},${s.f + (frame.current?.offsetTop || 0)})`,
            }}
          >
            <Canvas
              scene={scene}
              zone={s.zone}
              image
              language={language}
              saving={saving}
              onPublish={onDrawing}
              onClear={onClear}
            />
          </div>
        ))}
    </>
  );
}
