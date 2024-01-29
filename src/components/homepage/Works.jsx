import Heading from "../ui/Heading";
import Project from "../ui/Project";

import { projects as projectsData } from "../../data/projects";

const Works = () => {
  return (
    <section id="projects" className="bg-accent-400 -mt-px pb-20 rounded-b-3xl">
      <Heading title="Projects" />
      <div className="mt-10 flex flex-col px-10 place-items-center lg:w-9/12 mx-auto md:grid gap-y-10 gap-x-16 grid-cols-12">
        {projectsData.map((project) => (
          <div key={project.link} className={project.size === "big" ? "col-span-7" : "col-span-5"}>
            <Project {...project} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Works;
