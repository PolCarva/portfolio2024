import React, { useState } from "react";
import Heading from "../ui/Heading";
import Accordeon from "../ui/Accordeon";

const accordeonData = [
  {
    name: "Frontend",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis quos officia architecto.",
    tools: [
      "React",
      "NextJS",
      "TailwindCSS",
      "SCSS",
      "Bootstrap",
      "SCSS",
      "Bootstrap",
    ],
  },
  {
    name: "Backend",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis quos officia architecto.",
    tools: ["NodeJS", "Express", "MongoDB", "MySQL", "GraphQL", "Apollo"],
  },
  {
    name: "Design",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis quos officia architecto.",
    tools: ["Figma", "Adobe XD", "Adobe Photoshop", "Adobe Illustrator"],
  },
  {
    name: "Others",
    text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis quos officia architecto.",
    tools: ["Git", "GitHub", "GitLab", "Firebase", "Heroku", "Netlify"],
  },
];

const Skills = () => {
  const [accordeonOpen, setAccordeonOpen] = useState("");
  const handleOpenAccordeon = (name) => {
    if (accordeonOpen === name) {
      setAccordeonOpen("");
      return;
    }
    setAccordeonOpen(name);
  };
  return (
    <section id="skills" className="mt-16 px-5 md:px-0">
      <Heading title="Skills" />
      <div className="grid grid-cols-1 md:w-9/12 mx-auto md:grid-cols-2 gap-10 pt-10">
        <div className="h-full w-full flex flex-col gap-5">
          <h3 className="text-4xl md:text-6xl">
            my tech <span className="font-extrabold">stack.</span>
          </h3>
          <p className="text-body md:text-2xl font-medium font-grotesk">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Perspiciatis quos officia architecto ipsum est eos velit tenetur
            fugiat numquam. Reprehenderit, cum velit provident ratione nulla
            iure dolorem officia architecto labore.
          </p>
        </div>
        <div className="h-full w-full text-secondary">
          {accordeonData.map((accordeon, index) => (
            <Accordeon
              key={index}
              {...accordeon}
              handleOpenAccordeon={handleOpenAccordeon}
              isOpen={accordeonOpen === accordeon.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
