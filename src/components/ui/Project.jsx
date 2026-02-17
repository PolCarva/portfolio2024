import { useState } from "react";
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
  macOverlay = false,
}) => {
  const [displayedTools, setDisplayedTools] = useState(tools.slice(0, 5));
  const [startIndex, setStartIndex] = useState(0);

  const handleDotsClick = () => {
    const newStartIndex = startIndex + 5;
    const newDisplayedTools = tools.slice(newStartIndex, newStartIndex + 5);

    setStartIndex(newStartIndex);
    setDisplayedTools(newDisplayedTools);
  };

  // Componente de imagen del proyecto que se reutiliza
  const ProjectImage = () => (
    <div className={`relative image group overflow-hidden rounded-md hover:rounded-3xl transition ${link === "#" ? "no-cursor" : ""}`}>
      {macOverlay ? (
        <>
          <img
            className={`w-full select-none object-cover ${inactive && "grayscale blur-md"}`}
            src={bg}
            alt=""
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultBg;
            }}
          />
          <div className="absolute w-full h-full bg-white bg-opacity-20 backdrop-blur-md" />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <div className="relative w-full max-w-full rounded-lg border-2 border-neutral-700/90 bg-neutral-800/95 shadow-xl overflow-hidden scale-95 group-hover:scale-100 transition">
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-800 border-b border-neutral-700/80">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" aria-hidden />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" aria-hidden />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" aria-hidden />
              </div>
              <div className="relative overflow-hidden rounded-b-md bg-neutral-900">
                <img
                  className="w-full select-none object-cover"
                  src={img}
                  alt={`${name} project image`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProyectImg;
                  }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <img
            className="absolute select-none group-hover:scale-100 scale-95 transition z-20 shadow-md object-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            src={img}
            alt={`${name} project image`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProyectImg;
            }}
          />
          <div className="absolute w-full h-full bg-white bg-opacity-20 backdrop-blur-md" />
          <img
            className={`w-full select-none object-cover ${inactive && "grayscale blur-md"}`}
            src={bg}
            alt={`${name} background image`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultBg;
            }}
          />
        </>
      )}
    </div>
  );

  return (
    <div className={`w-full`}>
      {link === "#" ? (
        <ProjectImage />
      ) : (
        <a href={link} target="_blank">
          <ProjectImage />
        </a>
      )}
      <div className="mt-4">
        <div className="flex space-x-2 mb-3">
          <h3 className="flex-grow text-works-title 2xl:text-5xl font-medium uppercase text-primary-400">
            {name}
          </h3>
          <p className="rounded-full font-bold h-fit bg-transparent md:bg-secondary-600 flex justify-center items-center px-4 py-1 text-primary-400 text-body-4 2xl:text-3xl">
            {year}
          </p>
        </div>
        <div className="2xl:space-y-3">
          <div className="flex gap-2 flex-wrap content-start">
            {startIndex > 0 && (
              <span
                onClick={() => {
                  const newStartIndex = startIndex - 5;
                  const newDisplayedTools = tools.slice(
                    newStartIndex,
                    newStartIndex + 5
                  );

                  setStartIndex(newStartIndex);
                  setDisplayedTools(newDisplayedTools);
                }}
                className="hover:bg-secondary-600 hover:text-primary  transition rounded-full h-fit bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-md md:text-xl"
              >
                ...
              </span>
            )}

            {displayedTools.map((tool, index) => (
              <p
                key={index}
                className="rounded-full h-fit bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-md md:text-xl"
              >
                {tool}
              </p>
            ))}

            {tools.length > startIndex + 5 && (
              <span
                onClick={handleDotsClick}
                className="hover:bg-secondary-600 hover:text-primary  transition rounded-full h-fit bg-transparent border border-secondary-600 flex justify-center items-center px-4 py-1 text-secondary-600 text-md md:text-xl"
              >
                ...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project;
