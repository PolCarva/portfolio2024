import { useEffect, useState } from "react";
import { request } from "../admin-api";
import "./community.css";
export default function AdminCommunity() {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    setData(await request("/api/community?admin=1"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function act(action, revision, test, requestId, settings) {
    if (
      ["reset", "restore"].includes(action) &&
      !window.confirm(
        "Se restaurará el diseño comunitario y quedarán pausadas las intervenciones. Los turnos y el presupuesto se conservan. ¿Continuar?",
      )
    )
      return;
    if (
      action === "undo" &&
      !window.confirm(
        "Se deshará este pedido conservando los cambios posteriores que se puedan identificar. Las intervenciones quedarán pausadas; el turno y el presupuesto no se devuelven. ¿Continuar?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/community", {
        method: "POST",
        body: JSON.stringify({
          action,
          ...(settings ? { settings } : {}),
          ...(revision ? { revision } : {}),
          ...(test ? { test } : {}),
          ...(requestId ? { requestId } : {}),
        }),
      });
      if (action === "verify")
        setError(
          result.ok
            ? "Motor y comprobaciones de movimiento verificados."
            : "La comprobación detectó un efecto inestable: " +
                result.quality.issues.join(", "),
        );
      if (action === "test-ai")
        setError(
          result.ok
            ? "Prueba completada correctamente."
            : "La prueba no pasó: " + (result.reason || result.status),
        );
      if (action === "undo")
        setError(
          result.undo?.skippedFields.length || result.undo?.skippedNodes
            ? "Cambio revertido parcialmente: se conservaron partes modificadas por pedidos posteriores. Las intervenciones quedaron pausadas."
            : "Cambio revertido. Se conservaron los demás aportes y las intervenciones quedaron pausadas.",
        );
      await load();
    } catch (e) {
      setError(
        e.message === "undo_unavailable"
          ? "Esta petición ya fue revertida o su versión salió del historial disponible."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2>Portfolio comunitario</h2>
      <p>
        Tu contenido profesional se administra por separado. Estos controles
        solo afectan la capa visual de visitantes.
      </p>
      {error && <p role="alert">{error}</p>}
      {!data ? (
        <p>Cargando…</p>
      ) : (
        <>
          <p>
            <strong>
              {data.mode === "private" && !data.paused
                ? "Pruebas privadas: solo el administrador"
                : data.paused
                  ? "Intervenciones pausadas"
                  : "Intervenciones habilitadas"}
            </strong>{" "}
            ·{" "}
            {data.configured
              ? "Servicios configurados"
              : "Falta configurar Anthropic o Turnstile"}
          </p>
          <p>Revisión: {data.revision}</p>
          <div className="community-admin-actions">
            <button
              disabled={busy || (!data.configured && data.paused)}
              onClick={() => act(data.paused ? "resume" : "pause")}
            >
              {data.paused ? "Habilitar intervenciones" : "Pausar ahora"}
            </button>
            <button disabled={busy} onClick={() => act("reset")}>
              Restaurar diseño original
            </button>
            <button
              disabled={busy}
              onClick={() => load().catch((e) => setError(e.message))}
            >
              Actualizar
            </button>
          </div>
          <button
            disabled={busy || !data.configured}
            onClick={() => act("private")}
          >
            Activar pruebas privadas
          </button>
          <button disabled={busy} onClick={() => act("verify")}>
            Verificar motor de capturas
          </button>
          <div className="community-admin-actions">
            <button
              disabled={busy || !data.configured}
              onClick={() => act("test-ai", null, "safe")}
            >
              Probar generación y revisión
            </button>
            <button
              disabled={busy || !data.configured}
              onClick={() => act("test-ai", null, "unsafe")}
            >
              Probar rechazo de ataque
            </button>
          </div>
          <button
            disabled={busy || !data.configured}
            onClick={() => act("test-ai", null, "cursor")}
          >
            Probar código de cursor generado
          </button>
          <h3>Cupos por navegador</h3>
          <form
            key={JSON.stringify(data.settings)}
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget);
              act("settings", null, null, null, {
                publishedPerBrowser: Number(fields.get("publishedPerBrowser")),
                attemptsPerDay: Number(fields.get("attemptsPerDay")),
              });
            }}
          >
            <label>
              Intervenciones publicadas por navegador (1–100)
              <input
                name="publishedPerBrowser"
                type="number"
                min="1"
                max="100"
                required
                defaultValue={data.settings.publishedPerBrowser}
                disabled={busy}
              />
            </label>
            <label>
              Intentos de generación por navegador al día (3–50)
              <input
                name="attemptsPerDay"
                type="number"
                min="3"
                max="50"
                required
                defaultValue={data.settings.attemptsPerDay}
                disabled={busy}
              />
            </label>
            <p>
              Los aportes anteriores cuentan, incluso los revertidos. Aumentar
              el cupo permite volver a participar; se mantiene el presupuesto
              mensual.
            </p>
            <button type="submit" disabled={busy}>
              Guardar cupos
            </button>
          </form>
          <h3>Presupuesto de IA · USD 10 / mes</h3>
          <p>
            El cupo se reserva antes de generar; los errores y rechazos también
            cuentan. No se libera una reserva de resultado incierto.
          </p>
          {Object.entries(data.budgets).map(([month, b]) => (
            <p key={month}>
              {month}: USD {(b.reserved / 1e6).toFixed(2)} comprometidos · USD{" "}
              {(b.measured / 1e6).toFixed(4)} medidos
            </p>
          ))}
          <h3>Peticiones de visitantes</h3>
          <p>
            El texto se conserva hasta 30 días. Deshacer revierte lo que siga
            vigente de ese pedido; los cambios posteriores independientes se
            conservan.
          </p>
          <div className="community-admin-list">
            {data.jobs.map((j) => (
              <article className="community-admin-row" key={j.id}>
                <p>
                  <strong>
                    {{
                      prompt: "Prompt",
                      drawing: "Dibujo",
                      diagnostic: "Prueba privada",
                      admin: "Configuración del propietario",
                    }[j.kind] || "Prompt"}
                  </strong>{" "}
                  · {new Date(j.createdAt).toLocaleString("es-UY")}
                </p>
                <blockquote className="community-request-text">
                  {j.prompt ||
                    "Texto eliminado por la política de retención de 30 días."}
                </blockquote>
                <p>
                  {{
                    published: "Publicado",
                    rejected: "Rechazado",
                    failed: "No se pudo completar",
                    processing: "En revisión",
                    verified: "Verificado",
                    reverted: "Revertido",
                  }[j.status] || j.status}
                  {j.reason &&
                    " · " +
                      {
                        unsafe: "No superó la revisión de seguridad",
                        unsupported: "No se encontró una adaptación visual",
                        already_available:
                          "La capacidad solicitada ya estaba disponible",
                        quality:
                          "No superó la prueba de funcionamiento o estabilidad",
                        technical: "Error técnico",
                        timeout: "Tiempo de revisión agotado",
                        stale: "La versión cambió durante el proceso",
                        admin_reverted: "Deshecho por el administrador",
                      }[j.reason]}
                </p>
                {j.checks && (
                  <small>
                    Comprobaciones: {j.checks.framesTested} fotogramas ·{" "}
                    {j.checks.viewports?.join(" / ") || "sin animación"} ·{" "}
                    {j.checks.repairAttempts} corrección automática.
                  </small>
                )}
                {j.canUndo && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act("undo", null, null, j.id)}
                  >
                    Deshacer este cambio
                  </button>
                )}
                {j.status === "published" && !j.canUndo && (
                  <small>
                    Esta versión ya no está disponible para deshacer
                    individualmente.
                  </small>
                )}
                {j.revertedAt && (
                  <small>
                    Revertido el{" "}
                    {new Date(j.revertedAt).toLocaleString("es-UY")}
                  </small>
                )}
              </article>
            ))}
            {!data.jobs.length && <p>Todavía no se recibieron peticiones.</p>}
          </div>
          <details className="community-admin-history">
            <summary>Restaurar una versión completa</summary>
            <div className="community-admin-list">
              {data.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <div
                    className="community-admin-row"
                    key={h.revision + "-" + i}
                  >
                    <p>
                      {new Date(h.at).toLocaleString("es-UY")} · {h.revision}
                    </p>
                    <button
                      disabled={busy}
                      onClick={() => act("restore", h.revision)}
                    >
                      Restaurar esta versión
                    </button>
                  </div>
                ))}
              {!data.history.length && (
                <p>Todavía no hay intervenciones publicadas.</p>
              )}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
