import React, { useState } from "react";
import defaultBg from "../../assets/images/default-bg-img.png";
import defaultProyectImg from "../../assets/images/default-project-img.png";

const Project = ({
  name = "Project name",
  bg = defaultBg,
  img = defaultProyectImg,
  link = "#",
  year = 2024,
  tools = ["Development"],
  inactive = false,
}) => {
  const displayedTools = tools.slice(0, 5);

  return (
    <div className={`w-full`}>
      <a href={link} target="_blank">
        <div className="relative group overflow-hidden rounded-md hover:rounded-3xl transition">
          <img
            className="absolute group-hover:scale-100 scale-95 transition z-50 shadow-mdobject-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            src={img}
            alt={`${name} proyect image`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProyectImg;
            }}
          />
          <div className="absolute w-full h-full bg-white bg-opacity-20 backdrop-blur-md"></div>
          <img
            className={`w-full object-cover ${inactive && "grayscale blur-md"}`}
            src={bg}
            alt={`${name} background image`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultBg;
            }}
          />
        </div>
      </a>
      <div className="mt-4">
        <div className="flex space-x-2 mb-3">
          <h3 className="flex-grow text-works-title 2xl:text-5xl font-medium uppercase text-primary-400">
            {name}
          </h3>
          <p className="rounded-full h-fit bg-transparent md:bg-secondary-600 flex justify-center items-center px-4 py-1 text-primary-400 text-body-4 2xl:text-3xl">
            {year}
          </p>
        </div>
        <div className="2xl:space-y-3">
          <div className="flex gap-2 flex-wrap content-start">
            {displayedTools.map((tool, index) => (
              <p
                key={index}
                className="rounded-full h-fit bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-xl"
              >
                {tool}
              </p>
            ))}
            {tools.length > 5 && (
              <p
                className="rounded-full h-fit bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-xl cursor-pointer"
              >
                ...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
