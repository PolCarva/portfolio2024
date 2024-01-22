import FraseSection from "./components/homepage/FraseSection";
import Hero from "./components/homepage/Hero";
import NavBar from "./components/homepage/NavBar";
import Proyects from "./components/homepage/Proyects";

function App() {
  return (
    <div className="bg-primary text-accent noise min-h-[100svh] font-general">
      <NavBar />
      <Hero />
      <FraseSection />
      <Proyects />
    </div>
  );
}

export default App;
