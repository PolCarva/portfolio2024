import React from "react";
import Heading from "../ui/Heading";
import aboutImage1 from "../../assets/images/about/aboutimg.png";

const aboutData = [
  {
    title: "Who am I?",
    content:
      "I am a web developer with a passion for creating beautiful and functional websites. I am a self-taught developer and I am always looking for new challenges and opportunities to learn more.",
    img: { path: aboutImage1, alt: "Pablo's picture" },
  },
  {
    title: "My values.",
    content:
      "I am a web developer with a passion for creating beautiful and functional websites. I am a self-taught developer and I am always looking for new challenges and opportunities to learn more.",
    img: { path: "https://picsum.photos/200/300", alt: "Lorem 1" },
  },
  {
    title: "My hobbies.",
    content:
      "I am a web developer with a passion for creating beautiful and functional websites. I am a self-taught developer and I am always looking for new challenges and opportunities to learn more.",
    img: { path: "https://picsum.photos/300/300", alt: "Lorem 2" },
  },
];

const About = () => {
  return (
    <section id="about" className="mt-16 w-9/12 mx-auto px-5 md:px-0">
      <Heading title="ABOUT ME" />
      <div id="gallery" className="w-full flex">
        <div className="left w-1/2">
          <div className="detailsWrapper w-10/12 m-auto">
            {aboutData.map((data) => (
              <div
                key={data.title}
                className="details h-svh flex flex-col justify-center"
              >
                <h3 className="h-16 w-full text-6xl font-extrabold">
                  {data.title}
                </h3>
                <p className="mt-8 text-4xl">{data.content}</p>
              </div>
            ))}
          </div>
        </div>
        <div id="right" className=" h-svh w-[1/2] flex flex-col justify-center">
          <div className="about-photos w-[35svw] aspect-square rounded-xl relative overflow-hidden shadow-2xl">
            {aboutData.map((data, index) => (
              <img
                key={data.title}
                src={data.img.path}
                alt={data.img.alt}
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
