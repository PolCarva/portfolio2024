import Heading from "../ui/Heading";
import Project from "../ui/Project";

import { projects as projectsData } from "../../data/projects";

const Works = () => {
  const bigSizeByIndex = [0, 3, 4, 7, 8, 11, 12, 15, 16, 19, 20];
  return (
    <section id="projects" className="bg-accent-400 -mt-px pb-20 rounded-b-3xl">
      <Heading title="Projects" />
      <div className="mt-10 flex flex-col px-10 place-items-center lg:w-9/12 mx-auto md:grid gap-y-10 gap-x-16 grid-cols-12">
        {projectsData.map((project, index) => (
          <div key={project.link} className={bigSizeByIndex.includes(index) ? "col-span-7" : "col-span-5"}>
            <Project {...project} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default Works;
