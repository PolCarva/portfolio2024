import React from "react";
import defaultBg from "../../assets/images/default-bg-img.png";
import defaultProyectImg from "../../assets/images/default-project-img.png";

const Project = ({
  name = "Project name",
  bg = defaultBg,
  img = defaultProyectImg,
  alt = "default image",
  type = "Project type",
  link = "#",
  year = 2024,
  tools = "React",
}) => {
  return (
    <div className="w-full">
      <a href={link}>
        <div className="relative group overflow-hidden rounded-md hover:rounded-3xl transition">
          <img
            className="absolute z-50 shadow-mdobject-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            src={img}
            alt={alt}
          />
          <div className="absolute w-full h-full bg-white bg-opacity-20 backdrop-blur-md"></div>
          <img
            className="w-full object-cover"
            src={bg}
            alt={`${name} background image`}
          />
        </div>
      </a>
      <div className="mt-4">
        <div className="flex space-x-2 mb-3">
          <p className="rounded-full bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-body-4 2xl:text-3xl">
            {year}
          </p>
          <p className="rounded-full bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-body-4 2xl:text-3xl">
            {tools}
          </p>
        </div>
        <div className="2xl:space-y-3">
          <h3 className="text-works-title 2xl:text-5xl font-medium uppercase text-primary-200">
            {name}
          </h3>
          <p className="text-body-2 2xl:text-4xl font-light text-primary-400">
            {type}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Project;
