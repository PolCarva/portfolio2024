import React from "react";
import Heading from "../ui/Heading";
import { aboutData } from "../../data/aboutData";

const About = () => {
  return (
    <section id="about" className="mt-16 w-full md:w-9/12 mx-auto px-5 md:px-0">
      <Heading title="ABOUT ME" />
      {/* Mobile */}
      <div className="w-full flex gap-20 md:gap-16 flex-col lg:hidden mt-20">
        {aboutData.map(({ title, content, img }, index) => (
          <div
            key={`mobile-${title}`}
            className="w-full flex-col mobile-about"
            style={{ zIndex: index }}
          >
            <img
              src={img.path}
              alt={img.alt}
              className="w-full md:w-3/4 md:mx-auto aspect-square object-cover object-center rounded-lg"
            />
            <div className="flex flex-col gap-3 md:w-3/4 md:mx-auto">
              <h3 className="mt-5 w-full text-4xl font-extrabold">{title}</h3>
              <p className="text-body md:text-2xl">{content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div id="gallery" className="w-full hidden lg:flex">
        <div className="left w-1/2 min-h-[300svh]">
          <div className="detailsWrapper w-10/12 m-auto">
            {aboutData.map(({ title, content, img }) => (
              <div
                key={title}
                className="details min-h-svh h-svh flex-col justify-center flex"
              >
                <h3 className="h-16 w-full text-6xl font-extrabold">{title}</h3>
                <p className="mt-8 text-4xl">{content}</p>
              </div>
            ))}
          </div>
        </div>
        <div id="right" className="h-svh w-1/2 flex flex-col justify-center items-center shrink-0">
          <div className="about-photos w-[35svw] max-h-[85svh] aspect-square rounded-xl relative overflow-hidden shadow-2xl">
            {aboutData.map(({ title, img }, index) => (
              <img
                key={title}
                src={img.path}
                alt={img.alt}
                className={`absolute w-full h-full ${
                  index > 0 && "stacked-img"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
