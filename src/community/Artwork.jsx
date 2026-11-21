import { loadDraft, saveDraft, fingerprint } from "./draft.mjs";
import { Component, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  sceneColors,
  brushColors,
  drawingEnabled,
} from "../../shared/community-catalog.mjs";
export function SceneNodes({ scene, zone }) {
  const colors = {
    ...sceneColors(scene),
    ...Object.fromEntries(Object.entries(brushColors).filter(([, v]) => v)),
  };
  return (
    <svg
      className="community-art"
      viewBox="0 0 1000 240"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {scene.nodes
        .filter((n) => n.zone === zone)
        .map((n) => (
          <g
            key={n.id}
            className={`community-node community-motion-${n.motion}`}
            style={{ transformOrigin: `${n.x * 10}px ${n.y * 2.4}px` }}
          >
            <g
              transform={`translate(${n.x * 10} ${n.y * 2.4}) rotate(${n.rotation})`}
              fill={colors[n.color]}
              stroke={colors[n.color]}
              opacity={n.opacity}
            >
              {n.shape === "circle" ? (
                <circle r={n.size / 2} />
              ) : n.shape === "ellipse" ? (
                <ellipse rx={n.size} ry={n.size / 3} />
              ) : n.shape === "square" ? (
                <rect
                  x={-n.size / 2}
                  y={-n.size / 2}
                  width={n.size}
                  height={n.size}
                />
              ) : n.shape === "star" ? (
                <path
                  d={`M0 ${-n.size / 2} L${n.size * 0.12} ${-n.size * 0.12} L${n.size / 2} 0 L${n.size * 0.12} ${n.size * 0.12} L0 ${n.size / 2} L${-n.size * 0.12} ${n.size * 0.12} L${-n.size / 2} 0 L${-n.size * 0.12} ${-n.size * 0.12} Z`}
                />
              ) : n.shape === "ring" ? (
                <circle r={n.size / 2} fill="none" strokeWidth="2" />
              ) : n.shape === "line" ? (
                <path
                  d={`M${-n.size} 0 L${n.size} 0`}
                  fill="none"
                  strokeWidth="2"
                />
              ) : n.shape === "stroke" ? (
                <polyline
                  points={n.points
                    .map((p) => `${(p.x - 50) * 10},${(p.y - 50) * 2.4}`)
                    .join(" ")}
                  fill="none"
                  strokeWidth={n.strokeWidth || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : (
                <path
                  d={`M${(n.points[0]?.x || 0) - 50} ${(n.points[0]?.y || 0) - 50} C${(n.points[1]?.x || 0) - 50} ${(n.points[1]?.y || 0) - 50} ${(n.points[2]?.x || 0) - 50} ${(n.points[2]?.y || 0) - 50} ${(n.points[3]?.x || 0) - 50} ${(n.points[3]?.y || 0) - 50}`}
                  fill="none"
                  strokeWidth="3"
                />
              )}
            </g>
          </g>
        ))}
    </svg>
  );
}
const colorLabels = {
  es: {
    ink: "Tinta",
    accent: "Acento",
    red: "Rojo",
    blue: "Azul",
    green: "Verde",
    violet: "Violeta",
    gold: "Dorado",
  },
  en: {
    ink: "Ink",
    accent: "Accent",
    red: "Red",
    blue: "Blue",
    green: "Green",
    violet: "Violet",
    gold: "Gold",
  },
};
function DrawingTools({ floating, children }) {
  return floating && typeof document !== "undefined"
    ? createPortal(
        <div className="community-floating-tools">{children}</div>,
        document.body,
      )
    : children;
}
function CommunityCanvas({
  scene,
  zone,
  language = "es",
  preview = false,
  onPublish,
  onClear,
  image = false,
  saving = false,
}) {
  const [strokes, setStrokes] = useState(() =>
      preview ? [] : loadDraft(zone),
    ),
    [drawing, setDrawing] = useState(false),
    [color, setColor] = useState("ink"),
    [width, setWidth] = useState(4),
    [completed, setCompleted] = useState(0);
  const active = useRef(null),
    area = useRef(null),
    coordinates = useRef(null),
    activePointer = useRef(null),
    lastSent = useRef(""),
    es = language === "es";
  useEffect(() => {
    if (!scene) return;
    const saved = new Set(
      scene.nodes
        .filter((n) => n.shape === "stroke" && n.zone === zone)
        .map((n) =>
          JSON.stringify({
            points: n.points,
            color: n.color,
            width: n.strokeWidth || 3,
          }),
        ),
    );
    setStrokes((previous) => {
      const next = previous.filter((s) => !saved.has(JSON.stringify(s)));
      return next.length === previous.length ? previous : next;
    });
  }, [scene, zone]);
  useEffect(() => {
    if (!preview) saveDraft(zone, strokes);
  }, [zone, strokes, preview]);
  useEffect(() => {
    if (
      preview ||
      saving ||
      !onPublish ||
      !strokes.length ||
      strokes.some((s) => s.points.length < 2)
    )
      return;
    const draft = { zone, strokes },
      signature = fingerprint(draft);
    if (signature === lastSent.current) return;
    const timer = setTimeout(() => {
      if (active.current) return;
      lastSent.current = signature;
      onPublish(draft);
    }, 2500);
    return () => clearTimeout(timer);
  }, [zone, strokes, saving, onPublish, preview, completed]);
  if (!scene) return null;
  const colors = {
    ...sceneColors(scene),
    ...Object.fromEntries(Object.entries(brushColors).filter(([, v]) => v)),
  };
  const enabled = drawingEnabled(scene, zone);
  function point(e) {
    const r = area.current.getBoundingClientRect();
    if (coordinates.current?.getScreenCTM) {
      const matrix = coordinates.current.getScreenCTM();
      if (matrix) {
        const p = coordinates.current.createSVGPoint();
        p.x = e.clientX;
        p.y = e.clientY;
        const local = p.matrixTransform(matrix.inverse());
        return {
          x: Math.round(Math.max(0, Math.min(100, local.x / 10)) * 100) / 100,
          y: Math.round(Math.max(0, Math.min(100, local.y / 2.4)) * 100) / 100,
        };
      }
    }
    return {
      x:
        Math.round(
          Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)) *
            100,
        ) / 100,
      y:
        Math.round(
          Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) *
            100,
        ) / 100,
    };
  }
  function start(e) {
    if (
      !drawing ||
      !enabled ||
      saving ||
      active.current ||
      e.button !== 0 ||
      strokes.length >= 12
    )
      return;
    activePointer.current = e.pointerId;
    area.current.setPointerCapture(e.pointerId);
    const stroke = { points: [point(e)], color, width };
    active.current = stroke;
    setStrokes((s) => [...s, stroke]);
  }
  function move(e) {
    if (!drawing && area.current) {
      const r = area.current.getBoundingClientRect();
      area.current.style.setProperty(
        "--pointer-x",
        `${((e.clientX - r.left) / r.width - 0.5) * 24}px`,
      );
      area.current.style.setProperty(
        "--pointer-y",
        `${((e.clientY - r.top) / r.height - 0.5) * 16}px`,
      );
    }
    if (!active.current || activePointer.current !== e.pointerId) return;
    let points = [...active.current.points, point(e)];
    if (points.length > 64)
      points = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
    const stroke = { ...active.current, points };
    active.current = stroke;
    setStrokes((s) => [...s.slice(0, -1), stroke]);
  }
  function end(e) {
    if (!active.current || (e && activePointer.current !== e.pointerId)) return;
    if (active.current?.points.length === 1) {
      const stroke = {
        ...active.current,
        points: [...active.current.points, ...active.current.points],
      };
      active.current = stroke;
      setStrokes((s) => [...s.slice(0, -1), stroke]);
    }
    active.current = null;
    activePointer.current = null;
    setCompleted((v) => v + 1);
  }
  return (
    <aside
      id={`community-canvas-${zone}`}
      className={`community-canvas ${image ? "community-canvas--image" : ""} ${drawing ? "is-drawing" : ""}`}
      aria-label={es ? "Lienzo comunitario" : "Community canvas"}
    >
      <div
        ref={area}
        className="community-drawing-area"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        <svg
          ref={coordinates}
          className="community-coordinate-plane"
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          aria-hidden="true"
        />
        <SceneNodes scene={scene} zone={zone} />
        {enabled &&
          !strokes.length &&
          !scene.nodes.some((n) => n.zone === zone) && (
            <span className="community-canvas-hint" aria-hidden="true">
              {es ? "Dejá tu trazo acá" : "Leave your mark here"}
            </span>
          )}
        {strokes.length > 0 && (
          <svg
            className="community-art community-strokes"
            viewBox="0 0 1000 240"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {strokes.map((s, i) => (
              <polyline
                key={i}
                points={s.points
                  .map((p) => `${p.x * 10},${p.y * 2.4}`)
                  .join(" ")}
                fill="none"
                stroke={colors[s.color]}
                strokeWidth={s.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        )}
      </div>
      {enabled && !preview && (
        <DrawingTools floating={image && (drawing || strokes.length > 0)}>
          <div
            className={
              "community-draw-controls" +
              (image ? " community-image-tools" : "")
            }
          >
            <button
              type="button"
              disabled={saving}
              aria-pressed={drawing}
              onClick={() => setDrawing((v) => !v)}
            >
              {es
                ? drawing
                  ? "Terminar dibujo"
                  : image
                    ? zone === "portrait"
                      ? "Dibujar en la foto de perfil"
                      : "Dibujar en esta imagen"
                    : "Dibujar acá"
                : drawing
                  ? "Finish drawing"
                  : image
                    ? zone === "portrait"
                      ? "Draw on the profile photo"
                      : "Draw on this image"
                    : "Draw here"}
            </button>
            {(!image || drawing || strokes.length > 0) && (
              <>
                <label className="community-brush-label">
                  {es ? "Pincel" : "Brush"}
                  <select
                    aria-label={es ? "Tamaño del pincel" : "Brush size"}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                  >
                    {[2, 4, 8, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} px
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  className="community-brush-colors"
                  role="group"
                  aria-label={es ? "Color del pincel" : "Brush color"}
                >
                  {Object.keys(brushColors).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={(colorLabels[language] || colorLabels.en)[c]}
                      aria-pressed={color === c}
                      title={(colorLabels[language] || colorLabels.en)[c]}
                      className="community-color"
                      style={{ background: colors[c] }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    lastSent.current = "";
                    setStrokes([]);
                    active.current = null;
                    activePointer.current = null;
                    onClear?.(zone);
                  }}
                >
                  {es ? "Borrar borrador" : "Clear draft"}
                </button>
                <button
                  type="button"
                  disabled={saving || !strokes.length || !onPublish}
                  onClick={() => {
                    lastSent.current = fingerprint({ zone, strokes });
                    onPublish({ zone, strokes });
                  }}
                >
                  {es ? "Guardar ahora" : "Save now"} ↗
                </button>
                <small>
                  {strokes.length}/12{" "}
                  {es
                    ? "trazos · Guardado automático al hacer una pausa. Borrador conservado en este navegador."
                    : "strokes · Automatically saved when you pause. Draft retained in this browser."}
                </small>
              </>
            )}
          </div>
        </DrawingTools>
      )}
    </aside>
  );
}

class CanvasBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <aside className="community-canvas-error" role="alert">
          <p>
            {this.props.language === "es"
              ? "El lienzo tuvo un problema. El resto del portfolio sigue disponible."
              : "The canvas ran into a problem. The rest of the portfolio is still available."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
          >
            {this.props.language === "es"
              ? "Restablecer lienzo"
              : "Reset canvas"}
          </button>
        </aside>
      );
    return this.props.children;
  }
}
export default function ProtectedCommunityCanvas(props) {
  return (
    <CanvasBoundary language={props.language}>
      <CommunityCanvas {...props} />
    </CanvasBoundary>
  );
}
