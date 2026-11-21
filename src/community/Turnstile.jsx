import { useEffect, useRef } from "react";
export default function Turnstile({ siteKey, onToken, reset }) {
  const node = useRef(null);
  useEffect(() => {
    let widget,
      cancelled = false;
    function render() {
      if (cancelled || !node.current || !window.turnstile) return;
      widget = window.turnstile.render(node.current, {
        sitekey: siteKey,
        action: "portfolio-change",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => {
          onToken("");
          return true;
        },
      });
    }
    let script = document.querySelector("script[data-portfolio-turnstile]");
    if (window.turnstile) render();
    else {
      if (!script) {
        script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.portfolioTurnstile = "true";
        document.head.append(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      cancelled = true;
      script?.removeEventListener("load", render);
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [siteKey, onToken, reset]);
  return <div ref={node} className="community-turnstile" />;
}
