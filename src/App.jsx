import FraseSection from "./components/homepage/FraseSection";
import Hero from "./components/homepage/Hero";
import NavBar from "./components/homepage/NavBar";
import Works from "./components/homepage/Works";
import About from "./components/homepage/About";

function App() {
  return (
    <div className="bg-primary text-accent noise min-h-svh font-general">
      <NavBar />
      <Hero />
      <FraseSection />
      <Works />
      <About />
    </div>
  );
}

export default App;
