import React from "react";
import placeHolder3D from "../../assets/images/3dPlaceHolder.png";
import { Shapes } from "../ui/Shapes";

const FraseSection = () => {
  return (
    <section id="#frase-section">
      <div className="bg-accent-400 rounded-t-3xl items-center p-10 md:p-16 md:h-[70vh] flex flex-col md:flex-row place-content-center grid-cols-2">
        <Shapes />
        <p className="select-none md:w-1/2 font-grotesk col-span-2 md:col-span-1 font-bold text-xl md:text-5xl text-primary">
          I develop distinctive digital experiences, forging a powerful
          connection between the product and the consumer.
        </p>
      </div>
    </section>
  );
};

export default FraseSection;
