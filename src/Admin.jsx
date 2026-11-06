import { useEffect, useState } from "react";
import { request, upload } from "./admin-api";
import "./admin.css";
const labels = {
  projects: "Proyectos personales",
  clientProjects: "Trabajos para clientes",
  links: "Enlaces y contacto",
  media: "Foto y CV",
  copy: "Textos",
  es: "Español",
  en: "Inglés",
  title: "Título",
  text: "Descripción",
  alt: "Texto alternativo",
  label: "Sobretítulo",
  id: "Identificador",
  anchor: "Enlace directo (ancla)",
  year: "Año",
  kind: "Presentación",
  image: "Imagen",
  href: "Enlace",
  tags: "Tecnologías (inglés)",
  tagsEs: "Tecnologías (español)",
  downloads: "Botones de descarga",
  name: "Nombre",
  tools: "Tecnologías",
  hidden: "Ocultar en el portfolio",
  portrait: "Foto principal",
  cvEN: "CV en inglés (PDF)",
  cvES: "CV en español (PDF)",
  tvAppStore: "Teclado TV · App Store",
  tvApk: "Teclado TV · APK",
  tv: "Teclado TV · demostración",
  youtube: "Video interactivo · demostración",
  hero: "Título principal",
  intro: "Presentación",
  about: "Sobre mí",
  aboutMore: "Sobre mí · segundo párrafo",
  experience: "Experiencia",
  company: "Empresa",
  role: "Rol",
  date: "Fechas",
  capabilities: "Capacidades",
  toolkit: "Herramientas",
  workTitle: "Título de proyectos",
  workIntro: "Introducción de proyectos",
  contactText: "Texto de contacto",
  education: "Formación",
  educationDetail: "Detalle de formación",
  footer: "Pie de página",
};
const titleOf = (v, i) =>
  v?.es?.title ||
  (typeof v?.es === "string" ? v.es : "") ||
  v?.name ||
  v?.company ||
  (Array.isArray(v) ? v[1] : null) ||
  `Elemento ${i + 1}`;
const empty = (v) =>
  typeof v === "string"
    ? ""
    : typeof v === "boolean"
      ? false
      : Array.isArray(v)
        ? v.map(empty)
        : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, empty(x)]));
const newProject = () => ({
  id: "proyecto-" + Date.now().toString(36),
  year: String(new Date().getFullYear()),
  kind: "image",
  image: "",
  href: "",
  tags: [],
  tagsEs: [],
  downloads: [],
  hidden: false,
  es: { title: "Nuevo proyecto", label: "", text: "", alt: "" },
  en: { title: "New project", label: "", text: "", alt: "" },
});
function Editor({ value, onChange, name, path = "", onUpload }) {
  const [uploading, setUploading] = useState(false);
  const label = labels[name] || name.replace(/([a-z])([A-Z])/g, "$1 $2");
  const inputId = "field-" + path.replaceAll(".", "-");
  async function addFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await upload(file));
    } catch (error) {
      onUpload(error.message);
    } finally {
      setUploading(false);
    }
  }
  if (typeof value === "boolean")
    return (
      <label className="admin-toggle">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (typeof value === "string") {
    if (name === "kind")
      return (
        <label className="admin-field">
          {label}
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="image">Imagen propia</option>
            <option value="tv">Ilustración de Teclado TV</option>
            <option value="youtube">Ilustración de video interactivo</option>
          </select>
        </label>
      );
    const media = ["image", "portrait", "cvEN", "cvES"].includes(name);
    const multiline =
      value.length > 110 ||
      [
        "text",
        "intro",
        "about",
        "aboutMore",
        "alt",
        "workIntro",
        "contactText",
        "labText",
      ].includes(name);
    return (
      <div className="admin-field">
        <label htmlFor={inputId}>{label}</label>
        {multiline ? (
          <textarea
            id={inputId}
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
          />
        )}
        {media && (
          <div className="admin-upload">
            {!name.startsWith("cv") && value && (
              <img src={value} alt="Vista previa" loading="lazy" />
            )}
            <label className="admin-file">
              {uploading ? "Subiendo…" : "Subir archivo"}
              <input
                type="file"
                disabled={uploading}
                accept={
                  name.startsWith("cv")
                    ? "application/pdf"
                    : "image/png,image/jpeg,image/webp"
                }
                onChange={(e) => {
                  addFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <small>JPG, PNG, WebP o PDF · hasta 3 MB</small>
          </div>
        )}
      </div>
    );
  }
  if (Array.isArray(value)) {
    const objects = value.some((x) => typeof x === "object");
    const fixed =
      ["nav", "hero", "aboutTitle", "contactTitle"].includes(name) ||
      /capabilities\.\d+$/.test(path);
    const update = (i, next) =>
      onChange(value.map((v, n) => (n === i ? next : v)));
    const add = () => {
      let next = "";
      if (name === "projects") next = newProject();
      else if (name === "downloads")
        next = { href: "", es: "Descargar", en: "Download" };
      else if (value.length) next = empty(value[0]);
      if (name === "clientProjects" && !value.length)
        next = {
          name: "",
          year: "",
          image: "",
          href: "",
          tools: "",
          es: "",
          en: "",
        };
      onChange([...value, next]);
    };
    const move = (i, d) => {
      const next = [...value];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      onChange(next);
    };
    return (
      <fieldset className="admin-array">
        <legend>{label}</legend>
        {value.map((item, i) => (
          <div className="admin-array-item" key={i}>
            {objects ? (
              <details>
                <summary>
                  {String(i + 1).padStart(2, "0")} / {titleOf(item, i)}
                </summary>
                <div className="admin-nested">
                  <Editor
                    value={item}
                    onChange={(v) => update(i, v)}
                    name={String(i + 1)}
                    path={`${path}.${i}`}
                    onUpload={onUpload}
                  />
                </div>
              </details>
            ) : (
              <Editor
                value={item}
                onChange={(v) => update(i, v)}
                name={`${label} ${i + 1}`}
                path={`${path}.${i}`}
                onUpload={onUpload}
              />
            )}
            {!fixed && (
              <div className="admin-item-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Subir ${titleOf(item, i)}`}
                >
                  ↑ Subir
                </button>
                <button
                  type="button"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Bajar ${titleOf(item, i)}`}
                >
                  ↓ Bajar
                </button>
                <button
                  type="button"
                  className="admin-remove"
                  onClick={() => {
                    if (
                      window.confirm(
                        "¿Quitar este elemento del borrador? El cambio se aplicará al guardar.",
                      )
                    )
                      onChange(value.filter((_, n) => n !== i));
                  }}
                >
                  Quitar
                </button>
              </div>
            )}
          </div>
        ))}
        {!fixed && (
          <button type="button" className="admin-secondary" onClick={add}>
            + Agregar{" "}
            {name === "projects"
              ? "proyecto"
              : name === "downloads"
                ? "botón"
                : "elemento"}
          </button>
        )}
      </fieldset>
    );
  }
  return (
    <fieldset className="admin-object">
      {["es", "en"].includes(name) && <legend>{label}</legend>}
      <div className="admin-fields">
        {Object.entries(value).map(([k, v]) => (
          <Editor
            key={k}
            name={k}
            path={`${path}.${k}`}
            value={v}
            onChange={(next) => onChange({ ...value, [k]: next })}
            onUpload={onUpload}
          />
        ))}
      </div>
    </fieldset>
  );
}
export default function Admin() {
  const [phase, setPhase] = useState("loading"),
    [password, setPassword] = useState(""),
    [data, setData] = useState(null),
    [revision, setRevision] = useState("initial"),
    [section, setSection] = useState("projects"),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const sections = [
    ["projects", "Proyectos"],
    ["clientProjects", "Clientes"],
    ["es", "Textos · ES"],
    ["en", "Textos · EN"],
    ["links", "Enlaces"],
    ["media", "Foto y CV"],
  ];
  useEffect(() => {
    const controller = new AbortController();
    request("/api/session", { signal: controller.signal })
      .then(async (session) => {
        if (!session.authenticated) {
          setPhase("login");
          return;
        }
        const doc = await request("/api/content", {
          signal: controller.signal,
        });
        setData(doc.content);
        setRevision(doc.revision);
        setPhase("editor");
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setPhase("login");
        }
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request("/api/session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      const doc = await request("/api/content");
      if (!dirty) {
        setData(doc.content);
        setRevision(doc.revision);
      }
      setPhase("editor");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const doc = await request("/api/content", {
        method: "PUT",
        body: JSON.stringify({ revision, content: data }),
      });
      setRevision(doc.revision);
      setData(doc.content);
      setDirty(false);
      setNotice("Cambios publicados. Ya podés verlos en el portfolio.");
    } catch (e) {
      setError(e.message);
      if (e.status === 401) setPhase("login");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (
      dirty &&
      !window.confirm("Tenés cambios sin publicar. ¿Cerrar sesión igual?")
    )
      return;
    try {
      await request("/api/session", { method: "DELETE" });
      setPhase("login");
      setData(null);
      setDirty(false);
      setNotice("Sesión cerrada.");
    } catch (e) {
      setError(e.message);
    }
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "portfolio-contenido.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  const value =
    data &&
    (section === "es" || section === "en" ? data.copy[section] : data[section]);
  function update(next) {
    setData(
      section === "es" || section === "en"
        ? { ...data, copy: { ...data.copy, [section]: next } }
        : { ...data, [section]: next },
    );
    setDirty(true);
    setNotice("");
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          pablo<span>carvalho</span>
        </a>
        <span className="admin-kicker">PORTFOLIO / EDITOR</span>
        <a href="/es/" target="_blank" rel="noreferrer">
          Ver portfolio ↗
        </a>
      </header>
      {phase === "loading" ? (
        <p className="admin-loading">Cargando editor…</p>
      ) : phase === "login" ? (
        <section className="admin-login">
          <p className="admin-kicker">ACCESO PERSONAL</p>
          <h1>
            Tu trabajo,
            <br />
            <em>al día.</em>
          </h1>
          <p>Entrá para editar tu portfolio.</p>
          <form onSubmit={login}>
            <label htmlFor="admin-password">Contraseña</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={256}
            />
            <button disabled={busy}>
              {busy ? "Entrando…" : "Entrar al editor ↗"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="admin-toolbar">
            <div>
              <h1>Editar portfolio</h1>
              <p>
                {dirty ? "Tenés cambios sin publicar." : "Contenido publicado."}
              </p>
            </div>
            <div className="admin-toolbar-actions">
              <button className="admin-secondary" onClick={exportDraft}>
                Exportar copia
              </button>
              <button className="admin-secondary" onClick={logout}>
                Salir
              </button>
              <button disabled={busy || !dirty} onClick={save}>
                {busy ? "Guardando…" : "Guardar y publicar ↗"}
              </button>
            </div>
          </div>
          <div className="admin-layout">
            <nav aria-label="Secciones del editor">
              {sections.map(([key, title]) => (
                <button
                  key={key}
                  aria-current={key === section ? "page" : undefined}
                  onClick={() => {
                    setSection(key);
                    setError("");
                  }}
                >
                  {title}
                  <span>↗</span>
                </button>
              ))}
            </nav>
            <section
              className="admin-content"
              aria-label={sections.find(([k]) => k === section)?.[1]}
            >
              <p className="admin-hint">
                {section === "projects"
                  ? "El orden de esta lista es el orden del portfolio. Abrí cada proyecto para editar sus textos, imagen y botones."
                  : section === "es" || section === "en"
                    ? "Editá los textos de esta versión. Los cambios se aplican al guardar."
                    : "Los cambios se publican al guardar."}
              </p>
              <Editor
                key={section}
                name={section}
                value={value}
                onChange={update}
                path={section}
                onUpload={setError}
              />
            </section>
          </div>
        </>
      )}
      {error && (
        <div className="admin-message admin-error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Cerrar error">
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="admin-message" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}
    </main>
  );
}
