import NavBar from "./components/homepage/NavBar";
import Hero from "./components/homepage/Hero";
import FraseSection from "./components/homepage/FraseSection";
import Works from "./components/homepage/Works";
import About from "./components/homepage/About";
import Skills from "./components/homepage/Skills";
import Contact from "./components/homepage/Contact";


function App() {

  return (
      <div className="bg-primary text-accent noise min-h-svh font-general">
        <NavBar />
        <Hero />
        <FraseSection />
        <Works />
        <About />
        <Skills />
        <Contact />
      </div>
  );
}

export default App;
