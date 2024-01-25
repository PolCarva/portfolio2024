import React from "react";
import cvPdf from "../../assets/documents/cv_en.pdf";
import { MdOutlineFileDownload } from "react-icons/md";

import patternImg from "../../assets/images/pattern.png";

const Hero = () => {
  return (
    <section
      id="hero"
      className="w-full h-svh flex items-center justify-center pt-10"
    >
      <div
        className="absolute overflow-hidden gradient-mask bg-center top-1/2 left-1/2 w-5/6 md:4/5 lg:w-2/6 rounded-full aspect-square -translate-x-1/2 -translate-y-[40%]"
        style={{ backgroundImage: `url(${patternImg})` }}
      />
      <div className="z-40 flex flex-col gap-3 md:gap-7 h-full md:h-auto justify-end p-5">
        <h1 className="hero-text text-4xl md:text-title font-extrabold md:leading-[8rem] md:mx-auto order-1">
          <span>HI THERE, I’M </span>
          <br /> <span className="md:ml-12">PABLO CARVALHO.</span>
        </h1>
        <p className="pr-5 md:text-center font-grotesk font-bold text-lg md:text-4xl md:w-2/3 md:m-auto text-secondary-600 order-2">
          Fullstack developer & web designer based in Montevideo, Uruguay.
        </p>
        {/* download doc */}
        <a
          href={cvPdf}
          download="Pablo_Carvalho_CV_EN.pdf"
          className="py-2 px-6 w-fit self-end md:self-center cursor-pointer hover:scale-95 transition rounded-full font-grotesk order-0 md:order-2 md:text-2xl bg-accent-400 text-primary"
        >
          <span>resume</span>
          <MdOutlineFileDownload className="inline-block ml-2" />
        </a>
      </div>
    </section>
  );
};

export default Hero;
