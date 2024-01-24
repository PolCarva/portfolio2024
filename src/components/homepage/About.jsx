import React from "react";
import Heading from "../ui/Heading";
import aboutImage from "../../assets/images/about/aboutimg.png";

const About = () => {
  return (
    <section id="about" className="p-10">
      <Heading title="ABOUT ME" />
      <div className="grid grid-cols-1 full md:grid-cols-2 mt-10">
        <div className="w-full h-full flex justify-center col-span-1">
          <img
            src={aboutImage}
            alt="Pablo Carvalho"
            className="max-h-[110vh]"
          />
        </div>
        <div className="w-full h-full col-span-1 flex flex-col gap-5 mt-5 md:mt-0">
          <h3 className="text-accent text-4xl md:text-6xl font-extrabold">
            A short overview <span className="block">of who I am ...</span>
          </h3>
          <p className="text-2xl font-medium font-grotesk">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quis
            itaque cum modi quibusdam in quae sint vero rem ipsa, velit hic
            laudantium voluptatum a tenetur, vitae, et eligendi sequi. Rerum.
          </p>
          <p className="text-2xl font-medium font-grotesk">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Eius et
            modi officia, veritatis tempora voluptates recusandae perferendis!
            Praesentium, dignissimos. Repellendus praesentium perspiciatis
            tenetur illo totam laboriosam, rem laborum qui fugiat.
          </p>
          <p className="text-2xl font-medium font-grotesk">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error,
            consequuntur fuga! Porro veritatis quo, expedita eligendi laboriosam
            fugit repudiandae, fugiat autem alias eos ut consequatur magni
            pariatur quas recusandae itaque!
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
