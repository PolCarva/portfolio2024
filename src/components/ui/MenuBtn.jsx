import React from "react";

const MenuBtn = ({ isMenuOpen, setIsMenuOpen }) => {
  return (
    <div
      className={`w-fit h-fit fixed left-8 top-8 z-[999] ${
        isMenuOpen && "!scale-100 !opacity-100"
      }`}
      id="menu-btn"
    >
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex h-16 w-16 2xl:w-20 2xl:h-20 bg-secondary-400 flex-col items-center justify-center rounded-full hover:scale-90 sm:left-8 sm:top-8 transition group"
      >
        <span
          className={`h-[3px] w-7 2xl:w-9 rounded-full origin-center bg-primary transition-all duration-300 ease-in-out-circ ${
            isMenuOpen ? "rotate-45 translate-y-1/2" : "translate-y-[5px]"
          }`}
        ></span>
        <span
          className={`h-[3px] w-7 2xl:w-9 rounded-full origin-center bg-primary transition-all duration-300 ease-in-out-circ ${
            isMenuOpen ? "-rotate-45 top-1/2 -translate-y-1/2" : "translate-y-[-5px]"
          }`}
        ></span>
      </button>
    </div>
  );
};

export default MenuBtn;
