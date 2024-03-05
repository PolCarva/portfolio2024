import cvPdf from "../../assets/documents/Pablo_Carvalho_EN-small.pdf";
import { MdOutlineFileDownload } from "react-icons/md";

import patternImg from "../../assets/images/pattern.png";

const Hero = () => {
  const heroText = "HI THERE, I’M";
  const heroText2 = "PABLO CARVALHO.";
  const heroTextArray = heroText.split("");
  const heroTextArray2 = heroText2.split("");

  return (
    <section
      id="hero"
      className="w-full h-svh flex overflow-x-hidden items-center justify-center pt-10"
    >
      <div
        id="hero-pattern"
        className="fixed z-0 overflow-hidden gradient-mask bg-center top-1/2 left-1/2 w-5/6 md:4/5 lg:w-2/6 rounded-full aspect-square -translate-x-1/2 -translate-y-[40%]"
        style={{ backgroundImage: `url(${patternImg})` }}
      />
      <div className="flex z-10 flex-col gap-3 md:gap-7 h-full md:h-auto justify-end p-5">
        <div className="order-1 mx-0 md:mx-auto">
          <h1 className="w-full max-h-[1em] md:max-h-max hero-text overflow-hidden text-4xl md:text-title font-extrabold md:leading-[4rem] lg:leading-[8rem] md:mx-auto">
            {heroTextArray.map((letter, index) => (
              <span
                key={index}
                className={`letter inline-block ${
                  letter === " " && "w-[.3em]"
                }`}
              >
                {letter}
              </span>
            ))}
          </h1>
          <h1 className="w-full md:ml-12 max-h-[1em] md:max-h-max hero-text overflow-hidden text-4xl md:text-title font-extrabold md:leading-[4rem] lg:leading-[8rem] md:mx-auto">
            {heroTextArray2.map((letter, index) => (
              <span
                key={index}
                className={`letter-2 inline-block ${
                  letter === " " && "w-[.3em]"
                }`}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>
        <p
          id="hero-desc"
          className="pr-5 md:text-center font-grotesk font-bold text-lg md:text-4xl md:w-2/3 md:m-auto text-secondary-600 order-2"
        >
          Fullstack developer & web designer based in Montevideo, Uruguay.
        </p>
        {/* download doc */}
        <div className="w-fit hover:scale-95 transition order-0 md:order-2 self-end md:self-center">
          <a
            className="px-6 py-2 rounded-full font-grotesk md:text-2xl bg-accent-400 text-primary"
            href={cvPdf}
            download="Pablo_Carvalho_EN.pdf"
            id="download-cv"
          >
            <span>resume</span>
            <MdOutlineFileDownload className="inline-block ml-2" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
