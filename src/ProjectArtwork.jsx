import { useEffect, useRef } from "react";
import { videoAimMotion } from "./video-aim-motion";
import "./project-artwork.css";

function ArtworkFrame({ name, children, label, note, description }) {
  return (
    <div
      className={`project-artwork ${name}-art`}
      role="img"
      aria-label={description}
    >
      <div className="artwork-scene" aria-hidden="true">
        <span className="artwork-label">{label}</span>
        {children}
        <span className="artwork-note">{note}</span>
      </div>
    </div>
  );
}

export function ImpostorArtwork({ language }) {
  const es = language === "es";
  return (
    <ArtworkFrame
      name="impostor"
      label={es ? "DEDUCCIÓN SOCIAL" : "SOCIAL DEDUCTION"}
      note={
        es
          ? "ILUSTRACIÓN DEL CONCEPTO / EL IMPOSTOR"
          : "CONCEPT ILLUSTRATION / EL IMPOSTOR"
      }
      description={
        es
          ? "Ilustración de El Impostor: cartas con identidades ocultas y la pregunta ¿Quién miente?"
          : "El Impostor illustration: hidden-role cards and the question Who’s bluffing?"
      }
    >
      <div className="impostor-type">
        {es ? "¿QUIÉN" : "WHO’S"}
        <br />
        <em>{es ? "MIENTE?" : "BLUFFING?"}</em>
      </div>
      <span className="impostor-caption">
        {es ? "Una palabra. Una sospecha." : "One word. One suspicion."}
      </span>
      <div className="suspect-card suspect-card--back">
        <span>02 / ?</span>
        <div className="suspect-profile" />
        <b>{es ? "¿VOS?" : "YOU?"}</b>
      </div>
      <div className="suspect-card suspect-card--front">
        <span>01 / ?</span>
        <div className="suspect-mask">
          <i />
          <i />
        </div>
        <b>IMPOSTOR</b>
        <small>{es ? "QUE NO TE DESCUBRAN." : "KEEP YOUR COVER."}</small>
      </div>
      <div className="impostor-route">
        <i />
        <i />
        <i />
      </div>
    </ArtworkFrame>
  );
}

// Apply the game's repeated-letter rule so even this illustrative board is coherent.
function tilesFor(word, answer) {
  const pool = answer.split("");
  const tones = word.split("").map((letter, i) => {
    if (letter === pool[i]) {
      pool[i] = null;
      return "correct";
    }
    return "absent";
  });
  return word.split("").map((letter, i) => {
    if (tones[i] === "correct") return { letter, tone: tones[i] };
    const index = pool.indexOf(letter);
    if (index !== -1) {
      pool[index] = null;
      return { letter, tone: "present" };
    }
    return { letter, tone: "absent" };
  });
}
export function WordleArtwork({ language }) {
  const es = language === "es";
  const answer = es ? "JUEGO" : "TRACE";
  const words = es
    ? ["RATON", "CIELO", "JUNTO", "JUEGO"]
    : ["PLANT", "TRAIL", "CRANE", "TRACE"];
  return (
    <ArtworkFrame
      name="wordle"
      label={
        es ? "CINCO LETRAS. OTRA PARTIDA." : "FIVE LETTERS. ONE MORE ROUND."
      }
      note={
        es
          ? "ILUSTRACIÓN DEL CONCEPTO / WORDLE INFINITO"
          : "CONCEPT ILLUSTRATION / WORDLE INFINITO"
      }
      description={
        es
          ? "Ilustración de Wordle Infinito: una grilla de letras con pistas verdes y amarillas y la palabra JUEGO resuelta."
          : "Wordle Infinito illustration: a letter grid with green and yellow clues, ending with TRACE solved."
      }
    >
      <div className="wordle-type">
        {es ? "UNA" : "ONE"}
        <br />
        <em>{es ? "MÁS." : "MORE."}</em>
      </div>
      <span className="wordle-infinity">∞</span>
      <div className="wordle-board">
        {words.flatMap((word, row) =>
          tilesFor(word, answer).map(({ letter, tone }, column) => (
            <span
              key={`${row}-${column}`}
              className={`letter-tile letter-tile--${tone}${row === 3 ? " letter-tile--final" : ""}`}
              style={{ "--tile-order": column }}
            >
              {letter}
            </span>
          )),
        )}
      </div>
      <span className="wordle-caption">
        {es
          ? "La curiosidad no tiene límite."
          : "Curiosity has no finish line."}
      </span>
    </ArtworkFrame>
  );
}

export function PosterArtwork({ project, language }) {
  const p = project[language];
  return (
    <ArtworkFrame
      name="poster"
      label={p.label}
      note={
        language === "es" ? "ILUSTRACIÓN DEL PROYECTO" : "PROJECT ILLUSTRATION"
      }
      description={p.alt || p.title}
    >
      <div className="poster-title">{p.title}</div>
      <div className="poster-modules">
        <i />
        <i />
        <i />
      </div>
      <div className="poster-tags">
        {(language === "es" ? project.tagsEs || project.tags : project.tags)
          .slice(0, 3)
          .map((tag, i) => (
            <span key={`${tag}-${i}`}>{tag}</span>
          ))}
      </div>
    </ArtworkFrame>
  );
}

export function ClientArtwork({ project, language }) {
  const name = project.name.toLowerCase();
  const type =
    project.artwork ||
    (name.includes("jack")
      ? "fashion"
      : name.includes("luno")
        ? "sleep"
        : "web");
  return (
    <div
      className={`client-art client-art--${type}`}
      role="img"
      aria-label={
        language === "es"
          ? `Ilustración conceptual del trabajo para ${project.name}`
          : `Concept illustration of the work for ${project.name}`
      }
    >
      <div aria-hidden="true" className="client-art-scene">
        <span className="client-art-name">{project.name}</span>
        {type === "fashion" ? (
          <>
            <div className="garment garment--back" />
            <div className="garment garment--front" />
            <span className="client-art-caption">E-COMMERCE</span>
          </>
        ) : type === "sleep" ? (
          <>
            <span className="sleep-moon" />
            <div className="sleep-stack">
              <i />
              <i />
              <i />
            </div>
            <span className="client-art-caption">E-COMMERCE</span>
          </>
        ) : (
          <>
            <div className="site-sketch">
              <span>
                <i />
                <i />
                <i />
              </span>
              <b />
              <div>
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="client-art-caption">WEB / UI</span>
          </>
        )}
      </div>
    </div>
  );
}

export function VideoArtwork({ language, description }) {
  const root = useRef(null),
    target = useRef(null),
    play = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scene = root.current,
      anchor = scene.closest("a");
    let animations = [];
    function run() {
      if (
        reduced.matches ||
        !target.current?.animate ||
        animations.some((a) => a.playState === "running")
      )
        return;
      animations.forEach((a) => a.cancel());
      animations = [
        target.current.animate(videoAimMotion.target, {
          duration: videoAimMotion.duration,
          fill: "both",
          easing: "linear",
        }),
        play.current.animate(videoAimMotion.play, {
          duration: videoAimMotion.duration,
          fill: "both",
          easing: "ease-out",
        }),
      ];
      const startTime = document.timeline.currentTime;
      animations.forEach((animation) => {
        animation.startTime = startTime;
      });
    }
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                run();
                observer.disconnect();
              }
            },
            { threshold: 0.35 },
          )
        : null;
    if (observer) observer.observe(scene);
    else run();
    const stop = () => {
      if (reduced.matches) animations.forEach((a) => a.cancel());
    };
    anchor?.addEventListener("pointerenter", run);
    anchor?.addEventListener("focusin", run);
    reduced.addEventListener("change", stop);
    return () => {
      observer?.disconnect();
      animations.forEach((a) => a.cancel());
      anchor?.removeEventListener("pointerenter", run);
      anchor?.removeEventListener("focusin", run);
      reduced.removeEventListener("change", stop);
    };
  }, []);
  const es = language === "es";
  return (
    <div ref={root} className="video-art" role="img" aria-label={description}>
      <span className="art-corner">
        {es ? "EXPERIMENTO N.º 02" : "EXPERIMENT NO. 02"}
      </span>
      <span className="video-art-word">
        {es ? "DALE" : "PRESS"}
        <br />
        <em>PLAY.</em>
      </span>
      <span ref={target} className="play-target">
        <span ref={play} className="play-triangle" />
        <i />
        <b />
      </span>
      <span className="video-art-caption">
        {es
          ? "Un video. Un juego. Otra forma de interactuar."
          : "One video. One game. Another way to interact."}
      </span>
      <span className="art-note">YOUTUBE × INTERACTION</span>
    </div>
  );
}
