import React from "react";
import { Shapes } from "../ui/Shapes";

const FraseSection = () => {
  return (
    <section id="frase-section" >
      <div className="bg-accent-400 rounded-t-3xl items-center p-10 md:p-16 lg:h-[80vh] flex flex-col lg:flex-row place-content-center grid-cols-2">
        <Shapes />
        <p id="frase" className="select-none lg:w-1/2 font-grotesk col-span-2 md:col-span-1 font-bold text-xl md:text-5xl text-primary">
          I develop distinctive digital experiences, forging a powerful
          connection between the product and the consumer.
        </p>
      </div>
    </section>
  );
};

export default FraseSection;
