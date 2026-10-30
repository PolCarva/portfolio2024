import { useEffect, useRef, useState } from "react";
import { clientProjects, copy, links, projects } from "./content";

const sectionIds = ["work", "about", "experience", "contact"];
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function Asterisk() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 3v42M3 24h42M9.15 9.15l29.7 29.7M9.15 38.85l29.7-29.7"
        stroke="currentColor"
        strokeWidth="5"
      />
    </svg>
  );
}

function ProjectMedia({ project, language }) {
  const p = project[language];
  if (project.kind === "image")
    return (
      <img
        src={project.image}
        srcSet={`${project.image.replace(".webp", "-640.webp")} 640w, ${project.image} 1200w`}
        sizes="(max-width: 700px) 92vw, 44vw"
        width="1200"
        height="800"
        alt={p.alt}
        loading="lazy"
        decoding="async"
      />
    );
  if (project.kind === "tv")
    return (
      <div className="tv-art" role="img" aria-label={p.alt}>
        <span className="art-corner">
          {language === "es" ? "CELULAR → ANDROID TV" : "PHONE → ANDROID TV"}
        </span>
        <div className="tv-screen">
          <span className="tv-input">
            {language === "es" ? "Hola, tele" : "Hello, TV"}
            <i />
          </span>
          <span className="tv-caption">
            {language === "es"
              ? "Sin escribir letra por letra."
              : "Skip the letter-by-letter part."}
          </span>
        </div>
        <div className="phone">
          <span className="phone-speaker" />
          <span className="phone-label">
            {language === "es" ? "Tu teclado." : "Your keyboard."}
          </span>
          <span className="phone-text">
            {language === "es" ? "Hola, tele" : "Hello, TV"}
          </span>
          <div className="keyboard" aria-hidden="true">
            {"QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((key, i) => (
              <span key={i}>{key}</span>
            ))}
          </div>
          <span className="phone-space" />
        </div>
        <span className="signal signal--one" />
        <span className="signal signal--two" />
        <span className="art-note">{copy[language].imageNote} / 2026</span>
      </div>
    );
  return (
    <div className="video-art" role="img" aria-label={p.alt}>
      <span className="art-corner">
        {language === "es" ? "EXPERIMENTO N.º 02" : "EXPERIMENT NO. 02"}
      </span>
      <span className="video-art-word">
        {language === "es" ? "DALE" : "PRESS"}
        <br />
        <em>PLAY.</em>
      </span>
      <span className="play-target">
        <span className="play-triangle" />
        <i />
        <b />
      </span>
      <span className="video-art-caption">
        {language === "es"
          ? "Un video. Un juego. Otra forma de interactuar."
          : "One video. One game. Another way to interact."}
      </span>
      <span className="art-note">YOUTUBE × INTERACTION</span>
    </div>
  );
}

function ContactForm({ t }) {
  const [status, setStatus] = useState("idle");
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  async function handleSubmit(event) {
    event.preventDefault();
    if (request.current) return;
    const form = event.currentTarget;
    const controller = new AbortController();
    request.current = controller;
    setStatus("sending");
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Message delivery failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      clearTimeout(timeout);
      request.current = null;
    }
  }
  return (
    <form
      className="contact-form"
      aria-label={t.send}
      action="https://formspree.io/f/xpzedzvr"
      method="POST"
      onSubmit={handleSubmit}
    >
      <div className="form-row">
        <label htmlFor="contact-name">
          {t.name}
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength="120"
          />
        </label>
        <label htmlFor="contact-email">
          {t.email}
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength="254"
          />
        </label>
      </div>
      <label htmlFor="contact-message">
        {t.message}
        <textarea
          id="contact-message"
          name="message"
          required
          minLength="10"
          maxLength="5000"
          rows="3"
        />
      </label>
      <input
        type="text"
        name="_gotcha"
        className="honeypot"
        tabIndex="-1"
        autoComplete="off"
        aria-hidden="true"
      />
      <div className="form-bottom">
        <button
          className="button button--peach"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? t.sending : t.send}
          <Arrow />
        </button>
        <span className="form-note">{t.contactPrivacy}</span>
      </div>
      <p
        className={`form-status ${status === "error" ? "form-status--error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {status === "sent" ? t.sent : status === "error" ? t.error : ""}
      </p>
    </form>
  );
}

function App({ language = "en" }) {
  const lang = language === "es" ? "es" : "en";
  const t = copy[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || !("IntersectionObserver" in window)) return;
    const node = root.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    node
      .querySelectorAll(".reveal")
      .forEach((element) => observer.observe(element));
    node.classList.add("motion-ready");
    const stopMotion = () => {
      if (media.matches) {
        node.classList.remove("motion-ready");
        observer.disconnect();
      }
    };
    media.addEventListener("change", stopMotion);
    return () => {
      observer.disconnect();
      node.classList.remove("motion-ready");
      media.removeEventListener("change", stopMotion);
    };
  }, []);
  return (
    <div ref={root} className="portfolio" id="top">
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenuOpen(false);
        }}
      >
        <a
          className="wordmark"
          href={lang === "es" ? "/es/" : "/"}
          aria-label="Pablo Carvalho — home"
        >
          pablo<span>carvalho</span>
          <i>↗</i>
        </a>
        <nav
          className={`site-nav ${menuOpen ? "is-open" : ""}`}
          id="navigation"
          aria-label={
            lang === "es" ? "Navegación principal" : "Main navigation"
          }
        >
          {t.nav.map((item, index) => (
            <a
              key={item}
              href={`#${sectionIds[index]}`}
              onClick={() => setMenuOpen(false)}
            >
              {item}
              <span>0{index + 1}</span>
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <div
            className="language-switch"
            aria-label={lang === "es" ? "Idioma" : "Language"}
          >
            <a
              href="/"
              lang="en"
              hrefLang="en"
              aria-current={lang === "en" ? "page" : undefined}
            >
              EN
            </a>
            <span>/</span>
            <a
              href="/es/"
              lang="es"
              hrefLang="es"
              aria-current={lang === "es" ? "page" : undefined}
            >
              ES
            </a>
          </div>
          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "×" : t.menu}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero-topline">
            <p className="eyebrow">
              <span className="status-dot" />
              {t.role}
            </p>
            <p className="hero-location">
              MONTEVIDEO, UY <span>UTC−3</span>
            </p>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 id="hero-title">
                <span>{t.hero[0]}</span>
                <span className="hero-second">{t.hero[1]}</span>
              </h1>
              <p className="hero-intro">{t.intro}</p>
              <div className="hero-actions">
                <a className="button button--dark" href="#work">
                  {t.explore}
                  <Arrow />
                </a>
                <a
                  className="text-link"
                  href={`/cv/Pablo_Carvalho_${lang.toUpperCase()}.pdf`}
                  download
                >
                  {t.resume}
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <figure className="portrait-composition">
              <div className="portrait-frame">
                <img
                  src="/images/pablo-800.webp"
                  srcSet="/images/pablo-480.webp 480w, /images/pablo-800.webp 800w"
                  sizes="(max-width: 700px) 76vw, 32vw"
                  width="800"
                  height="800"
                  alt={t.portrait}
                />
                <span className="portrait-mark" aria-hidden="true">
                  <Asterisk />
                </span>
              </div>
              <figcaption>
                <span>PABLO CARVALHO</span>
                <span>{t.portraitNote}</span>
              </figcaption>
            </figure>
          </div>
          <div className="hero-bottom">
            <p>{t.location}</p>
            <a href="#work" className="scroll-cue" aria-label={t.explore}>
              {t.scroll} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <div className="discipline-strip" aria-hidden="true">
          {t.strip.map((item) => (
            <span key={item}>
              <Asterisk />
              {item}
            </span>
          ))}
        </div>
        <section
          id="work"
          className="work-section section-shell"
          aria-labelledby="work-title"
        >
          <div className="section-heading reveal">
            <p className="eyebrow">{t.workLabel}</p>
            <div>
              <h2 id="work-title">{t.workTitle}</h2>
              <p>{t.workIntro}</p>
            </div>
          </div>
          <div className="project-grid">
            {projects.map((project, index) => (
              <article
                className={`project project--${project.id} reveal`}
                key={project.id}
              >
                <a
                  className="project-link"
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project[lang].title} — ${project.kind === "image" ? t.visit : t.watch}`}
                >
                  <div className="project-media">
                    <ProjectMedia project={project} language={lang} />
                    <span className="project-number">
                      0{index + 1} / {project.year}
                    </span>
                    <span className="project-open">
                      <Arrow />
                    </span>
                  </div>
                  <div className="project-caption">
                    <p className="eyebrow">{project[lang].label}</p>
                    <h3>{project[lang].title}</h3>
                    <p>{project[lang].text}</p>
                    <div className="project-tags">
                      {(lang === "es" && project.tagsEs
                        ? project.tagsEs
                        : project.tags
                      ).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
          <div className="client-work reveal">
            <div className="client-heading">
              <p className="eyebrow">{t.clientLabel}</p>
              <h3>{t.clientTitle}</h3>
            </div>
            {clientProjects.map((project) => (
              <a
                className="client-row"
                key={project.name}
                href={project.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${project.name} — ${t.clientVisit}`}
              >
                <img
                  src={project.image}
                  width="480"
                  height="320"
                  alt={`${project.name} — ${project[lang]}`}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <h4>{project.name}</h4>
                  <p>
                    {project[lang]}
                    <span>{project.tools}</span>
                  </p>
                </div>
                <span className="client-year">{project.year}</span>
                <Arrow />
              </a>
            ))}
          </div>
        </section>
        <section
          id="about"
          className="about-section section-shell"
          aria-labelledby="about-title"
        >
          <div className="about-intro reveal">
            <p className="eyebrow">{t.aboutLabel}</p>
            <h2 id="about-title">
              {t.aboutTitle[0]}
              <br />
              <em>{t.aboutTitle[1]}</em>
            </h2>
            <div className="about-body">
              <Asterisk />
              <div>
                <p>{t.about}</p>
                <p>{t.aboutMore}</p>
              </div>
            </div>
          </div>
          <div className="capability-section reveal">
            <h3>{t.capabilityTitle}</h3>
            <div className="capabilities">
              {t.capabilities.map(([number, title, text]) => (
                <details key={number}>
                  <summary>
                    <span>{number}</span>
                    <h4>{title}</h4>
                    <i aria-hidden="true">+</i>
                  </summary>
                  <p>{text}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="toolkit reveal">
            <p className="eyebrow">{t.toolkitLabel}</p>
            <p>{t.toolkit}</p>
          </div>
        </section>
        <section
          id="experience"
          className="experience-section section-shell"
          aria-labelledby="experience-title"
        >
          <div className="section-heading reveal">
            <p className="eyebrow">{t.experienceLabel}</p>
            <h2 id="experience-title">{t.experienceTitle}</h2>
          </div>
          <div className="experience-list">
            {t.experience.map((item) => (
              <article key={item.company} className="experience-row reveal">
                <p className="experience-date">{item.date}</p>
                <div>
                  <h3>{item.company}</h3>
                  <h4>{item.role}</h4>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="education-row reveal">
            <span className="eyebrow">
              {lang === "es" ? "FORMACIÓN" : "EDUCATION"}
            </span>
            <div>
              <h3>{t.education}</h3>
              <p>{t.educationDetail}</p>
            </div>
            <div className="resume-links">
              <a href="/cv/Pablo_Carvalho_EN.pdf" download>
                CV / EN <span>↓</span>
              </a>
              <a href="/cv/Pablo_Carvalho_ES.pdf" download>
                CV / ES <span>↓</span>
              </a>
            </div>
          </div>
          <aside className="workbench reveal">
            <span className="workbench-symbol" aria-hidden="true">
              ↗
            </span>
            <div>
              <p className="eyebrow">{t.labLabel}</p>
              <h3>{t.lab}</h3>
              <p>{t.labText}</p>
            </div>
            <span className="workbench-dots" aria-hidden="true">
              •••
            </span>
          </aside>
        </section>
        <section
          id="contact"
          className="contact-section section-shell"
          aria-labelledby="contact-title"
        >
          <p className="eyebrow reveal">{t.contactLabel}</p>
          <div className="contact-grid">
            <div className="contact-copy reveal">
              <h2 id="contact-title">
                {t.contactTitle[0]}
                <br />
                <em>{t.contactTitle[1]}</em>
              </h2>
              <p>{t.contactText}</p>
              <a className="email-link" href={`mailto:${links.email}`}>
                {links.email}
                <Arrow />
              </a>
              <div className="social-links">
                <a href={links.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn <Arrow />
                </a>
                <a href={links.github} target="_blank" rel="noreferrer">
                  GitHub <Arrow />
                </a>
                <a href={links.whatsapp} target="_blank" rel="noreferrer">
                  WhatsApp <Arrow />
                </a>
              </div>
            </div>
            <div className="reveal">
              <ContactForm t={t} />
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-shell">
        <a className="footer-name" href="#top">
          PABLO CARVALHO<span>© 2026</span>
        </a>
        <div>
          <p>{t.footer}</p>
          <a href="#top">{t.top} ↑</a>
        </div>
      </footer>
    </div>
  );
}
export default App;
