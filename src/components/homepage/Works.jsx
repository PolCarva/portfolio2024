import Heading from "../ui/Heading";
import Project from "../ui/Project";

const Works = () => {
  return (
    <section id="proyects" className="bg-accent-400 -mt-px">
      <Heading title="Proyects" />
      <div className="mt-10 flex flex-col px-10 place-items-center md:w-9/12 mx-auto lg:grid gap-16 gap-y-10 lg:grid-cols-12">
        <div className="col-span-12">
          <Project />
        </div>
        <div className="col-span-12">
          <Project />
        </div>
      </div>
    </section>
  );
};

export default Works;
