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
  async function act(action, revision, test) {
    if (
      ["reset", "restore"].includes(action) &&
      !window.confirm(
        "Se restaurará el diseño comunitario y quedarán pausadas las intervenciones. Los turnos y el presupuesto se conservan. ¿Continuar?",
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
          ...(revision ? { revision } : {}),
          ...(test ? { test } : {}),
        }),
      });
      if (action === "verify") setError("Motor de capturas verificado.");
      if (action === "test-ai")
        setError(
          result.ok
            ? "Prueba completada correctamente."
            : "La prueba no pasó: " + (result.reason || result.status),
        );
      await load();
    } catch (e) {
      setError(e.message);
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
              {data.paused
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
          <h3>Historial para restaurar</h3>
          <div className="community-admin-list">
            {data.history
              .slice()
              .reverse()
              .map((h, i) => (
                <div className="community-admin-row" key={h.revision + "-" + i}>
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
          <h3>Últimas solicitudes</h3>
          <div className="community-admin-list">
            {data.jobs.map((j) => (
              <div className="community-admin-row" key={j.id}>
                <p>
                  {new Date(j.createdAt).toLocaleString("es-UY")} · {j.status}{" "}
                  {j.reason && "· " + j.reason}
                </p>
                <small>{j.id}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
