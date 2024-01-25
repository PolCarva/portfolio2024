import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import NavBar from "./components/homepage/NavBar";
import Hero from "./components/homepage/Hero";
import FraseSection from "./components/homepage/FraseSection";
import Works from "./components/homepage/Works";
import About from "./components/homepage/About";
import Skills from "./components/homepage/Skills";
import Contact from "./components/homepage/Contact";
import Footer from "./components/homepage/Footer";

gsap.registerPlugin(ScrollTrigger);

function App() {
  const comp = useRef(null);

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
        stagger: 0.02,
        delay: 0.5,
        ease: "ease.out",
      });
      gsap.from(".letter-2", {
        yPercent: 100,
        duration: 0.5,
        stagger: 0.02,
        delay: 0.6,
        ease: "ease.out",
      });
      gsap.from(["#hero-desc", "#download-cv"], {
        opacity: 0,
        duration: 1,
        delay: 1.5,
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
    }, comp);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={comp}
      className="bg-primary text-accent noise min-h-svh font-general"
    >
      <div id="top-section">
        <NavBar />
        <Hero />
      </div>
      <div className="z-10 relative">
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
