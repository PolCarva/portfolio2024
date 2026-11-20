import { useEffect, useRef, useState } from "react";
import { palettes, brushColors } from "../../shared/community-catalog.mjs";
export function SceneNodes({ scene, zone }) {
  const colors = {
    ...palettes[scene.palette],
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
export default function CommunityCanvas({
  scene,
  zone,
  language = "es",
  preview = false,
  onPublish,
  onClear,
}) {
  const [strokes, setStrokes] = useState([]),
    [drawing, setDrawing] = useState(false),
    [color, setColor] = useState("ink"),
    [width, setWidth] = useState(4);
  const active = useRef(null),
    area = useRef(null),
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
  if (!scene) return null;
  const colors = {
    ...palettes[scene.palette],
    ...Object.fromEntries(Object.entries(brushColors).filter(([, v]) => v)),
  };
  function point(e) {
    const r = area.current.getBoundingClientRect();
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
    if (!drawing || e.button !== 0 || strokes.length >= 12) return;
    area.current.setPointerCapture(e.pointerId);
    active.current = { points: [point(e)], color, width };
    setStrokes((s) => [...s, active.current]);
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
    if (!active.current) return;
    let points = [...active.current.points, point(e)];
    if (points.length > 64)
      points = points.filter((_, i) => i % 2 === 0 || i === points.length - 1);
    active.current = { ...active.current, points };
    setStrokes((s) => [...s.slice(0, -1), active.current]);
  }
  function end() {
    if (active.current?.points.length === 1) {
      active.current = {
        ...active.current,
        points: [...active.current.points, ...active.current.points],
      };
      setStrokes((s) => [...s.slice(0, -1), active.current]);
    }
    active.current = null;
  }
  return (
    <aside
      id={`community-canvas-${zone}`}
      className={`community-canvas ${drawing ? "is-drawing" : ""}`}
      aria-label={es ? "Lienzo comunitario" : "Community canvas"}
    >
      <div
        ref={area}
        className="community-drawing-area"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <SceneNodes scene={scene} zone={zone} />
        {scene.drawing &&
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
      {scene.drawing && !preview && (
        <div className="community-draw-controls">
          <button
            type="button"
            aria-pressed={drawing}
            onClick={() => setDrawing((v) => !v)}
          >
            {es
              ? drawing
                ? "Terminar dibujo"
                : "Dibujar acá"
              : drawing
                ? "Finish drawing"
                : "Draw here"}
          </button>
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
            onClick={() => {
              setStrokes([]);
              active.current = null;
              onClear?.(zone);
            }}
          >
            {es ? "Borrar borrador" : "Clear draft"}
          </button>
          <button
            type="button"
            disabled={!strokes.length || !onPublish}
            onClick={() => {
              setDrawing(false);
              onPublish({ zone, strokes });
            }}
          >
            {es ? "Publicar este dibujo" : "Publish this drawing"} ↗
          </button>
          <small>
            {strokes.length}/12{" "}
            {es
              ? "trazos · Se guardan para todos después de la revisión con IA. Una publicación por navegador."
              : "strokes · Saved for everyone after AI review. One publication per browser."}
          </small>
        </div>
      )}
    </aside>
  );
}
