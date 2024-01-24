const Accordeon = ({ name, tools = [], text, isOpen, handleOpenAccordeon }) => {
  return (
    <div
      className="w-full border-b border-secondary cursor-pointer group flex flex-col gap-5 py-5 select-none"
      onClick={() => handleOpenAccordeon(name)}
    >
      <div className="flex justify-between items-center">
        <h4 className="group-hover:ml-3 transition text-3xl md:text-5xl font-bold">
          {name}
        </h4>
        <i className="relative w-12 h-12">
          <svg
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
              isOpen && "rotate-90"
            } transition`}
            width="2"
            height="25"
            viewBox="0 0 1 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0.5" y1="0.5" x2="0.5" y2="25" stroke="#4D4A46" />
          </svg>
          <svg
            className="rotate-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            width="2"
            height="25"
            viewBox="0 0 1 27"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="0.5" y1="0.5" x2="0.5" y2="25" stroke="#4D4A46" />
          </svg>
        </i>
      </div>
      <div className={`flex-col gap-5 ${isOpen ? "flex" : "hidden"}`}>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool, index) => (
            <p
              key={index}
              className="rounded-full h-fit bg-transparent border border-accent flex justify-center items-center px-4 py-1 text-accent text-xl"
            >
              {tool}
            </p>
          ))}
        </div>
        <p className="text-accent text-body md:text-2xl font-medium font-grotesk">
          {text}
        </p>
      </div>
    </div>
  );
};

export default Accordeon;
