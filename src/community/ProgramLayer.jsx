import { useEffect, useMemo, useRef } from "react";
import { programDocument } from "../../shared/community-program.mjs";
export default function ProgramLayer({ program, preview = false }) {
  const frame = useRef(null);
  const source = useMemo(
    () => programDocument(program, preview),
    [program, preview],
  );
  useEffect(() => {
    if (preview) return;
    const iframe = frame.current,
      reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let pointer = { x: innerWidth / 2, y: innerHeight / 3, down: false };
    function send() {
      if (!reduced.matches)
        iframe.contentWindow?.postMessage(
          { type: "portfolio-input", ...pointer, scrollY },
          "*",
        );
    }
    function move(event) {
      if (event.pointerType === "touch") return;
      pointer = { x: event.clientX, y: event.clientY, down: event.buttons > 0 };
      send();
    }
    function motion() {
      iframe.hidden = reduced.matches;
    }
    iframe.addEventListener("load", send);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    window.addEventListener("pointerup", move, { passive: true });
    window.addEventListener("scroll", send, { passive: true });
    window.addEventListener("resize", send);
    reduced.addEventListener("change", motion);
    send();
    motion();
    return () => {
      iframe.removeEventListener("load", send);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
      window.removeEventListener("pointerup", move);
      window.removeEventListener("scroll", send);
      window.removeEventListener("resize", send);
      reduced.removeEventListener("change", motion);
    };
  }, [preview, source]);
  return (
    <iframe
      ref={frame}
      className={
        "community-program" +
        (program.layer === "background" ? " community-program-background" : "")
      }
      title="Community visual program"
      aria-hidden="true"
      tabIndex={-1}
      inert=""
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; fullscreen 'none'"
      srcDoc={source}
    />
  );
}
