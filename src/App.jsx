import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import NavBar from "./components/homepage/NavBar";
import Hero from "./components/homepage/Hero";
import FraseSection from "./components/homepage/FraseSection";
import Works from "./components/homepage/Works";
import About from "./components/homepage/About";
import Skills from "./components/homepage/Skills";
import Contact from "./components/homepage/Contact";
import Footer from "./components/homepage/Footer";
import Menu from "./components/homepage/Menu";

import Cursor from "./components/ui/Cursor";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const comp = useRef();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.5,
      ease: "ease.out",
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  });

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from("#hero-pattern", {
        backgroundSize: "100%",
        opacity: 0,
        scale: 0.5,
        top: "80%",
        duration: 1.5,
        ease: "back.out",
        delay: 0.8,
      });
      gsap.from("#logo", {
        x: 50,
        opacity: 0,
        duration: 1,
        delay: 0.5,
      });
      gsap.from(".nav-link", {
        x: -50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        delay: 0.5,
      });
      gsap.from("#availability", {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 1,
      });
      gsap.from(".letter", {
        yPercent: 100,
        duration: 0.5,
        stagger: 0.05,
        delay: 1.5,
        ease: "ease.out",
      });
      gsap.from(".letter-2", {
        yPercent: 100,
        duration: 0.5,
        stagger: 0.05,
        delay: 2,
        ease: "ease.out",
      });
      gsap.from(["#hero-desc", "#download-cv"], {
        opacity: 0,
        duration: 1,
        delay: 2.1,
        stagger: 0.2,
      });

      ScrollTrigger.create({
        trigger: "#top-section",
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
        pin: true,
        pinSpacing: false,
        animation: gsap.to("#top-section", {
          opacity: 0,
          ease: "power-out",
        }),
      });

      gsap.set("#menu-btn", { scale: 0, opacity: 0 });

      ScrollTrigger.create({
        trigger: "#menu-section",
        start: "top top",
        end: "bottom top",
        toggleActions: "play reverse play reverse",
        animation: gsap.to("#menu-btn", {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out",
        }),
      });

      ScrollTrigger.create({
        trigger: "#frase",
        start: "90% bottom",
        toggleActions: "play reverse play reverse",
        animation: gsap.from("#frase", {
          opacity: 0,
          duration: 1.5,
          x: -50,
          ease: "power2.inout",
        }),
      });

      const headings = gsap.utils.toArray(".heading");
      headings.forEach((heading) => {
        ScrollTrigger.create({
          trigger: heading,
          start: "bottom 85%",
          animation: gsap.from(heading.children[0], {
            opacity: 0,
            duration: 0.8,
            yPercent: 100,
            ease: "power-out",
          }),
        });
      });
      // About gallery: pin + stacked images solo en desktop (lg+). Las imágenes solo se muestran al entrar en About.
      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": function () {
          const photos = gsap.utils.toArray(".stacked-img") || [];
          gsap.set(photos, { yPercent: 101 });

          // Ocultar la columna de fotos hasta que entremos en About (evitar que se superpongan con Projects)
          gsap.set("#right", { opacity: 0 });

          ScrollTrigger.create({
            trigger: "#gallery",
            start: "top 5%",
            end: "bottom bottom",
            pin: "#right",
            pinSpacing: true,
            onEnter: () => gsap.to("#right", { opacity: 1, duration: 0.25 }),
            onLeaveBack: () => gsap.to("#right", { opacity: 0, duration: 0.2 }),
          });

          const details = gsap.utils.toArray(".details") || [];
          details.forEach((detail, index) => {
            if (index === 0) return;
            const photo = photos[index - 1];
            if (!photo) return;
            const headline = detail.querySelector("h3");
            if (!headline) return;
            ScrollTrigger.create({
              trigger: headline,
              start: "top 80%",
              end: "top 40%",
              animation: gsap.to(photo, { yPercent: 0 }),
              scrub: true,
            });
          });
        },
      });

      /* const mobileAbout = gsap.utils.toArray(".mobile-about");
      mobileAbout.forEach((mobile, index) => {
        if (index === mobileAbout.length - 1) return;
        ScrollTrigger.create({
          trigger: mobile,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
          pin: true,
          animation: gsap.to(mobile, {
            opacity: 0,
            ease: "power4.out",
          }),
        });
      }); */
    }, comp);

    let resizeTimeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      ctx.revert();
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div
      ref={comp}
      className="bg-primary text-accent noise min-h-svh font-general cursor-none"
    >
      <Cursor />
      <Menu />
      <div id="top-section">
        <NavBar />
        <Hero />
      </div>
      <div id="menu-section" className="z-10 relative">
        <FraseSection />
        <Works />
        <About />
        <Skills />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}

export default App;
