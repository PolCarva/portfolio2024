import { useRef, useState } from "react";
import { palettes } from "../../shared/community-catalog.mjs";
export function SceneNodes({ scene, zone }) {
  const colors = palettes[scene.palette];
  return (
    <svg
      className="community-art"
      viewBox="0 0 1000 240"
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
export default function CommunityCanvas({
  scene,
  zone,
  language = "es",
  preview = false,
}) {
  const [strokes, setStrokes] = useState([]),
    [drawing, setDrawing] = useState(false);
  const active = useRef(null),
    area = useRef(null);
  if (!scene) return null;
  function point(e) {
    const r = area.current.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      Math.max(0, Math.min(240, ((e.clientY - r.top) / r.height) * 240)),
    ];
  }
  function start(e) {
    if (!drawing || e.button !== 0) return;
    area.current.setPointerCapture(e.pointerId);
    active.current = [point(e)];
    setStrokes((s) => [...s.slice(-29), active.current]);
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
    if (active.current.length >= 120) return;
    active.current = [...active.current, point(e)];
    setStrokes((s) => [...s.slice(0, -1), active.current]);
  }
  return (
    <aside
      className={`community-canvas ${drawing ? "is-drawing" : ""}`}
      aria-label={language === "es" ? "Lienzo comunitario" : "Community canvas"}
    >
      <div
        ref={area}
        className="community-drawing-area"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          active.current = null;
        }}
        onPointerCancel={() => {
          active.current = null;
        }}
      >
        <SceneNodes scene={scene} zone={zone} />
        {strokes.length > 0 && (
          <svg
            className="community-art community-strokes"
            viewBox="0 0 1000 240"
            aria-hidden="true"
          >
            {strokes.map((s, i) => (
              <polyline
                key={i}
                points={s.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
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
            {language === "es"
              ? drawing
                ? "Terminar dibujo"
                : "Dibujar acá"
              : drawing
                ? "Finish drawing"
                : "Draw here"}
          </button>
          <button type="button" onClick={() => setStrokes([])}>
            {language === "es" ? "Borrar trazos" : "Clear strokes"}
          </button>
          <small>
            {language === "es" ? "Solo en tu pantalla" : "Only on your screen"}
          </small>
        </div>
      )}
    </aside>
  );
}
