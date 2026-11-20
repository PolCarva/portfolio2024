import { useEffect, useRef, useState } from "react";
import { communityMarkPath } from "../../shared/community-catalog.mjs";
const copy = {
  es: {
    badge: "Diseño intervenido por visitantes",
    waitingBadge: "Un portfolio que podemos transformar",
    join: "Dejá tu cambio",
    original: "Ver diseño original",
    community: "Ver versión comunitaria",
    title: "Este portfolio también es tuyo.",
    intro:
      "Un pedido. Un cambio que verán los demás. Podés transformar la estética y sumar dibujos o movimiento. Mi identidad y mi trabajo permanecen intactos.",
    label: "¿Qué le cambiarías?",
    placeholder:
      "Un jardín digital: tonos verdes, tarjetas redondeadas y estrellas que flotan…",
    examples: [
      "Una estética retro y geométrica",
      "Un cielo espacial con partículas",
      "Activá un lienzo para dibujar",
    ],
    privacy:
      "Tu pedido se procesa con IA y se conserva hasta 30 días para prevenir abuso. No incluyas datos personales. No se publica el texto del pedido.",
    limit:
      "Un prompt o un dibujo publicado por navegador. Los rechazos no gastan tu turno; hasta tres intentos de generación por día.",
    send: "Proponer y publicar",
    busy: "Construyendo tu cambio…",
    autoUpdate: "La página se actualiza sola al terminar.",
    progress: "Ver progreso",
    close: "Cerrar",
    success:
      "Tu cambio ya forma parte del portfolio. Gracias por dejar tu huella.",
    counter: "caracteres",
    waiting: "Si cerrás esta ventana, la revisión puede continuar.",
    reason: {
      already_available:
        "Eso ya está disponible. Podés dibujar en el lienzo y enviar tu aporte para guardarlo.",
      admin_reverted:
        "El propietario revirtió tu aporte. Esa intervención sigue contando en tu cupo.",
      capacity:
        "El lienzo alcanzó su capacidad. Probá con menos trazos o un cambio de estilo.",
      not_configured:
        "El experimento está en preparación. Pronto vas a poder participar.",
      paused:
        "Las intervenciones están pausadas. Podés seguir explorando el portfolio.",
      used: "Alcanzaste el cupo de intervenciones de este navegador. ¡Gracias por participar!",
      budget: "Se alcanzó el cupo de IA de este mes.",
      busy: "Otra persona está dejando su cambio. Volvé a intentar en unos minutos.",
      verification:
        "No pudimos verificar el control antibot. Volvé a intentarlo.",
      verification_unavailable:
        "El control antibot no está disponible. Probá más tarde.",
      rate_limited: "Alcanzaste el límite de intentos. Probá mañana.",
      unsafe:
        "La propuesta no superó los controles de seguridad. Probá con otra idea visual.",
      unsupported:
        "Ese pedido está fuera de las posibilidades visuales del experimento.",
      stale: "El diseño cambió durante la revisión. Tu turno sigue disponible.",
      technical: "No pudimos completar la revisión. Tu turno sigue disponible.",
      timeout: "La revisión tardó demasiado. Tu turno sigue disponible.",
      invalid: "El pedido debe tener entre 3 y 500 caracteres.",
      unavailable: "No pudimos conectar. Intentá más tarde.",
      visitor_required:
        "Recargá la página y permití las cookies propias para participar.",
    },
  },
  en: {
    badge: "Design remixed by visitors",
    waitingBadge: "A portfolio we can transform",
    join: "Leave your change",
    original: "View original design",
    community: "View community version",
    title: "This portfolio is yours, too.",
    intro:
      "One request. A change everyone will see. Transform its look, add drawings or motion. My identity and work stay intact.",
    label: "What would you change?",
    placeholder:
      "A digital garden: green tones, rounded cards and floating stars…",
    examples: [
      "A retro geometric look",
      "A space sky with particles",
      "Enable a drawing canvas",
    ],
    privacy:
      "Your request is processed with AI and kept for up to 30 days to prevent abuse. Do not include personal information. Your request text is not published.",
    limit:
      "One published prompt or drawing per browser. Rejections do not use your turn; up to three generation attempts a day.",
    send: "Propose and publish",
    busy: "Building your change…",
    autoUpdate: "The page updates automatically when it is ready.",
    progress: "View progress",
    close: "Close",
    success:
      "Your change is now part of the portfolio. Thanks for leaving your mark.",
    counter: "characters",
    waiting: "The review may continue if you close this window.",
    reason: {
      already_available:
        "That feature is already available. You can draw on the canvas and submit your contribution to save it.",
      admin_reverted:
        "The owner reverted your contribution. It still counts toward your allowance.",
      capacity:
        "The canvas reached its capacity. Try fewer strokes or a style change.",
      not_configured:
        "The experiment is being prepared. Participation will open soon.",
      paused:
        "Changes are currently paused. You can still explore the portfolio.",
      used: "You reached the contribution limit for this browser. Thank you!",
      budget: "This month’s AI allowance has been reached.",
      busy: "Someone else is making a change. Please try again in a few minutes.",
      verification:
        "The antibot check could not be verified. Please try again.",
      verification_unavailable:
        "The antibot check is unavailable. Try again later.",
      rate_limited: "Attempt limit reached. Please try again tomorrow.",
      unsafe:
        "The proposal did not pass the safety checks. Try a different visual idea.",
      unsupported:
        "That request is outside the visual capabilities of this experiment.",
      stale: "The design changed during review. Your turn is still available.",
      technical:
        "The review could not be completed. Your turn is still available.",
      timeout: "The review took too long. Your turn is still available.",
      invalid: "Please enter between 3 and 500 characters.",
      unavailable: "Could not connect. Please try later.",
      visitor_required: "Reload and allow first-party cookies to participate.",
    },
  },
};
async function api(path, options = {}) {
  const r = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "unavailable");
  return d;
}
function Turnstile({ siteKey, onToken, reset }) {
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
export default function CommunityControls({
  language,
  onScene,
  drawingDraft,
  onDrawingComplete,
}) {
  const t = copy[language === "es" ? "es" : "en"];
  const es = language === "es";
  const [data, setData] = useState(null),
    [open, setOpen] = useState(false),
    [original, setOriginal] = useState(false),
    [prompt, setPrompt] = useState(""),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [reset, setReset] = useState(0),
    [toast, setToast] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 9000);
    return () => clearTimeout(timer);
  }, [toast]);
  const dialog = useRef(null),
    opener = useRef(null),
    closed = useRef(false);
  useEffect(() => {
    closed.current = false;
    const controller = new AbortController();
    api("/api/community", { signal: controller.signal })
      .then((d) => setData(d))
      .catch(() => {});
    return () => {
      closed.current = true;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    if (data) onScene(original || !data.modified ? null : data.scene);
  }, [data, original, onScene]);
  useEffect(() => {
    if (busy) return;
    let cancelled = false,
      inFlight = false;
    const controller = new AbortController();
    async function sync() {
      if (inFlight) return;
      inFlight = true;
      try {
        const current = await api("/api/community", {
          signal: controller.signal,
        });
        if (!cancelled) setData(current);
      } catch {
        // Keep the last known availability when refreshing fails.
      } finally {
        inFlight = false;
      }
    }
    sync();
    const interval = setInterval(
      () => {
        if (!document.hidden) sync();
      },
      open ? 8000 : 30000,
    );
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [open, busy]);
  useEffect(() => {
    if (drawingDraft) {
      setOpen(true);
      setNotice("");
      setPrompt(
        es
          ? "Quiero sumar este dibujo al lienzo comunitario."
          : "I want to add this drawing to the community canvas.",
      );
    }
  }, [drawingDraft, es]);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function key(e) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const nodes = [
          ...dialog.current.querySelectorAll(
            'button:not(:disabled),textarea:not(:disabled),iframe,[tabindex="0"]',
          ),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [open]);
  async function refresh() {
    const d = await api("/api/community");
    if (!closed.current) setData(d);
  }
  async function follow(id) {
    for (let i = 0; i < 145; i++) {
      const d = await api("/api/community/changes/" + id);
      if (d.status !== "processing") return d;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error("timeout");
  }
  async function submit(e) {
    e.preventDefault();
    if (busy || !token || prompt.trim().length < 3 || prompt.length > 500)
      return;
    setBusy(true);
    setNotice("");
    const id = crypto.randomUUID();
    try {
      let result;
      try {
        result = await api("/api/community/changes", {
          method: "POST",
          body: JSON.stringify({
            id,
            prompt: prompt.trim(),
            token,
            ...(drawingDraft ? { drawing: drawingDraft } : {}),
          }),
        });
      } catch (e) {
        if (
          e.message !== "Failed to fetch" &&
          e.message !== "NetworkError when attempting to fetch resource."
        )
          throw e;
        result = await follow(id);
      }
      if (result.status === "processing") result = await follow(id);
      setNotice(
        result.status === "published"
          ? "success"
          : result.reason || "technical",
      );
      if (result.status === "published") {
        onDrawingComplete?.();
        setPrompt("");
        setOriginal(false);
      }
      if (result.status === "published") {
        await refresh().catch(() => {});
        setOpen(false);
        setToast(true);
      } else await refresh();
    } catch (e) {
      setNotice(t.reason[e.message] ? e.message : "unavailable");
    } finally {
      setBusy(false);
      setToken("");
      setReset((v) => v + 1);
    }
  }
  if (!data) return null;
  return (
    <>
      {toast && (
        <div className="community-toast" role="status">
          {t.success}
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setToast(false)}
          >
            ×
          </button>
        </div>
      )}
      <div
        className="community-bar"
        aria-label={
          language === "es" ? "Experimento comunitario" : "Community experiment"
        }
      >
        <span>{data.modified ? t.badge : t.waitingBadge}</span>
        {
          <button type="button" onClick={() => setOriginal((v) => !v)}>
            {original ? t.community : t.original}
          </button>
        }
        <button
          ref={opener}
          type="button"
          className="community-cta"
          onClick={() => setOpen(true)}
        >
          {busy ? t.progress : t.join} ↗
        </button>
      </div>
      {open && (
        <div
          className="community-panel"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section
            ref={dialog}
            className="community-panel-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-title"
          >
            <button
              type="button"
              className="community-close"
              onClick={() => setOpen(false)}
            >
              {t.close} ×
            </button>
            <p className="eyebrow">PABLO × COMMUNITY / 01</p>
            <h2 id="community-title">{t.title}</h2>
            <p>{t.intro}</p>
            {!data.available && (
              <p className="community-notice" role="status">
                {t.reason[data.reason] || t.reason.unavailable}
              </p>
            )}
            <form onSubmit={submit} aria-busy={busy}>
              {busy ? (
                <div
                  className="community-building"
                  role="status"
                  aria-live="polite"
                >
                  <div className="community-building-icon" aria-hidden="true">
                    <svg viewBox="0 0 30 30">
                      <path d={communityMarkPath} />
                    </svg>
                  </div>
                  <h3>{t.busy}</h3>
                  <div className="community-building-lines" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <small>{t.autoUpdate}</small>
                </div>
              ) : (
                <>
                  {drawingDraft && (
                    <p className="community-notice">
                      {es
                        ? `${drawingDraft.strokes.length} ${drawingDraft.strokes.length === 1 ? "trazo listo" : "trazos listos"} para revisar y guardar. Tu aporte se suma al lienzo compartido.`
                        : `${drawingDraft.strokes.length} ${drawingDraft.strokes.length === 1 ? "stroke" : "strokes"} ready for review and saving. Your drawing joins the shared canvas.`}
                    </p>
                  )}
                  {drawingDraft && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        onDrawingComplete?.();
                        setPrompt("");
                      }}
                    >
                      {es
                        ? "Continuar solo con un prompt"
                        : "Continue with a prompt only"}
                    </button>
                  )}
                  <label htmlFor="community-prompt">
                    {drawingDraft
                      ? es
                        ? "Describí tu dibujo"
                        : "Describe your drawing"
                      : t.label}
                  </label>
                  <textarea
                    id="community-prompt"
                    maxLength={500}
                    minLength={3}
                    required
                    rows={4}
                    placeholder={
                      drawingDraft
                        ? es
                          ? "Describí lo que dibujaste…"
                          : "Describe what you drew…"
                        : t.placeholder
                    }
                    value={prompt}
                    disabled={busy}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <small>
                    {prompt.length}/500 {t.counter}
                  </small>
                  {!drawingDraft && (
                    <div className="community-example-row">
                      {t.examples.map((example) => (
                        <button
                          key={example}
                          type="button"
                          disabled={busy}
                          onClick={() => setPrompt(example)}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  )}
                  <small>
                    {data.participation
                      ? es
                        ? `${data.participation.remaining} de ${data.participation.limit} intervenciones disponibles en este navegador. Los rechazos no gastan el cupo; hasta ${data.participation.attemptsPerDay} intentos de generación al día.`
                        : `${data.participation.remaining} of ${data.participation.limit} contributions available in this browser. Rejections do not use your allowance; up to ${data.participation.attemptsPerDay} generation attempts a day.`
                      : t.limit}
                  </small>
                  <p>
                    <small>{t.privacy}</small>
                  </p>
                  {data.available && data.siteKey && (
                    <Turnstile
                      siteKey={data.siteKey}
                      onToken={setToken}
                      reset={reset}
                    />
                  )}
                  <button
                    type="submit"
                    disabled={
                      busy ||
                      !data.available ||
                      !token ||
                      prompt.trim().length < 3
                    }
                  >
                    {busy ? t.busy : t.send} ↗
                  </button>
                  {busy && <p role="status">{t.waiting}</p>}
                  {notice === "already_available" && data.scene?.drawing && (
                    <p>
                      <a
                        className="text-link"
                        href="#community-canvas-hero"
                        onClick={() => {
                          setOriginal(false);
                          onScene(data.scene);
                          setOpen(false);
                        }}
                      >
                        {es
                          ? "Ir al lienzo compartido"
                          : "Go to the shared canvas"}{" "}
                        ↗
                      </a>
                    </p>
                  )}
                  {notice && (
                    <p className="community-notice" role="status">
                      {notice === "success"
                        ? t.success
                        : t.reason[notice || data.reason] ||
                          t.reason.unavailable}
                    </p>
                  )}
                </>
              )}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
