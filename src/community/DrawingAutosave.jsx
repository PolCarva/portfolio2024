import { useEffect, useRef, useState } from "react";
import Turnstile from "./Turnstile";
import { api, follow } from "./request.mjs";
import { fingerprint } from "./draft.mjs";
const pendingKey = "community-drawing-pending-v1";
function pending(draft) {
  try {
    const record = JSON.parse(localStorage.getItem(pendingKey));
    if (
      record.fingerprint === fingerprint(draft) &&
      Date.now() - record.at < 86400000
    )
      return record;
  } catch {
    /* No previous request. */
  }
  return {
    id: crypto.randomUUID(),
    fingerprint: fingerprint(draft),
    at: Date.now(),
    started: false,
    attempts: 0,
  };
}
function remember(record) {
  try {
    if (record) localStorage.setItem(pendingKey, JSON.stringify(record));
    else localStorage.removeItem(pendingKey);
  } catch {
    /* The visible draft is still retained. */
  }
}
export default function DrawingAutosave({
  draft,
  language,
  data,
  onSaved,
  onCancel,
}) {
  const es = language === "es";
  const [token, setToken] = useState(""),
    [reset, setReset] = useState(0),
    [status, setStatus] = useState("verifying"),
    [retry, setRetry] = useState(0);
  const request = useRef(null),
    running = useRef(false),
    callbacks = useRef({ onSaved, onCancel });
  callbacks.current = { onSaved, onCancel };
  if (!request.current) request.current = pending(draft);
  useEffect(() => {
    let cancelled = false,
      timer;
    async function save() {
      if (running.current) return;
      const record = request.current;
      if (!record.started && !token) return;
      running.current = true;
      setStatus("saving");
      try {
        let result;
        if (record.started) {
          try {
            result = await follow(record.id);
          } catch (e) {
            if (e.message !== "not_found") throw e;
            record.started = false;
          }
        }
        if (!record.started) {
          if (!token) {
            setStatus("verifying");
            setReset((v) => v + 1);
            setRetry((v) => v + 1);
            return;
          }
          // Persist the ID BEFORE sending: a lost response is resumed, never duplicated.
          record.started = true;
          remember(record);
          try {
            result = await api("/api/community/changes", {
              method: "POST",
              body: JSON.stringify({
                id: record.id,
                prompt: es
                  ? "Sumar este dibujo al lienzo compartido."
                  : "Add this drawing to the shared canvas.",
                token,
                drawing: draft,
              }),
            });
          } catch (e) {
            if (
              [
                "Failed to fetch",
                "NetworkError when attempting to fetch resource.",
              ].includes(e.message)
            )
              result = await follow(record.id);
            else {
              record.started = false;
              throw e;
            }
          }
        }
        if (result.status === "processing") result = await follow(record.id);
        if (result.status === "published") {
          remember(null);
          setStatus("saved");
          await callbacks.current.onSaved();
          return;
        }
        // A completed technical failure gets at most one fresh automatic attempt.
        record.started = false;
        record.id = crypto.randomUUID();
        throw new Error(result.reason || "technical");
      } catch (error) {
        const reason = error.message;
        setStatus(reason);
        record.attempts++;
        remember(record);
        if (
          [
            "busy",
            "unavailable",
            "technical",
            "timeout",
            "stale",
            "Failed to fetch",
          ].includes(reason) &&
          record.attempts < 2
        ) {
          timer = setTimeout(() => {
            if (!cancelled) {
              setStatus("verifying");
              setToken("");
              setReset((v) => v + 1);
              setRetry((v) => v + 1);
            }
          }, 4000);
        }
      } finally {
        running.current = false;
      }
    }
    save();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, token, retry, es]);
  useEffect(() => {
    if (status !== "verifying") return;
    const timer = setTimeout(
      () => setStatus("verification_unavailable"),
      60000,
    );
    return () => clearTimeout(timer);
  }, [status, reset]);
  const busy = ["saving", "verifying"].includes(status);
  const reason = {
    unsafe: es
      ? "Solo se frenan dibujos claramente ofensivos. Podés editar este borrador."
      : "Only clearly offensive drawings are blocked. You can edit this draft.",
    used: es
      ? "Alcanzaste el cupo de aportes. El borrador sigue guardado en este navegador."
      : "Contribution limit reached. Your draft is still saved in this browser.",
    budget: es
      ? "Se agotó el cupo mensual de IA. Tu borrador está guardado."
      : "Monthly AI allowance reached. Your draft is saved.",
    paused: es
      ? "El guardado compartido está pausado. Tu borrador está guardado."
      : "Shared saving is paused. Your draft is saved.",
    capacity: es
      ? "El lienzo está lleno. Tu borrador sigue guardado."
      : "The canvas is full. Your draft is still saved.",
    rate_limited: es
      ? "Alcanzaste el límite de intentos de hoy. Tu borrador está guardado."
      : "Daily attempt limit reached. Your draft is saved.",
  };
  return (
    <section
      className="community-drawing-save"
      aria-label={es ? "Guardado del dibujo" : "Drawing autosave"}
      aria-busy={busy}
    >
      <p role="status">
        {status === "saved"
          ? es
            ? "Dibujo guardado para todos."
            : "Drawing saved for everyone."
          : status === "saving"
            ? es
              ? "Guardando tu dibujo…"
              : "Saving your drawing…"
            : status === "verifying"
              ? es
                ? "Preparando el guardado automático…"
                : "Preparing automatic saving…"
              : reason[status] ||
                (es
                  ? "No se pudo compartir todavía. Tu borrador sigue guardado en este navegador."
                  : "Could not share yet. Your draft is still saved in this browser.")}
      </p>
      {status !== "saved" && (
        <small>
          {es
            ? "Guardado directo y automático. El dibujo queda visible para todos."
            : "Direct automatic saving. Your drawing becomes visible to everyone."}
        </small>
      )}
      {!busy && status !== "saved" && (
        <div>
          <button
            type="button"
            onClick={() => {
              request.current.attempts = 0;
              setStatus("verifying");
              setToken("");
              setReset((v) => v + 1);
              setRetry((v) => v + 1);
            }}
          >
            {es ? "Reintentar" : "Retry"}
          </button>
          <button
            type="button"
            onClick={() => {
              remember(null);
              callbacks.current.onCancel?.();
            }}
          >
            {es ? "Seguir dibujando" : "Keep drawing"}
          </button>
        </div>
      )}
      {data.siteKey && status === "verifying" && (
        <Turnstile siteKey={data.siteKey} onToken={setToken} reset={reset} />
      )}
    </section>
  );
}
