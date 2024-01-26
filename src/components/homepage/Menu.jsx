import React, { useState } from "react";

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <button
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className="z-[999] flex h-16 w-16 2xl:w-20 2xl:h-20 bg-secondary-400 flex-col items-center justify-center rounded-full hover:scale-90  fixed left-6 top-6 sm:left-8 sm:top-8 transition group scale-100"
    >
      <span
        className={`${isMenuOpen && "!rotate-45 translate-y-0.5"} absolute h-[3px] w-7 2xl:w-9 rounded-full bg-primary transition-all duration-300 ease-in-out-circ -translate-y-1 rotate-0`}
      ></span>
      <span
        className={`${isMenuOpen && "!-rotate-45 translate-y-0.5"} absolute h-[3px] w-7 2xl:w-9 rounded-full bg-primary transition-all duration-300 ease-in-out-circ translate-y-1 rotate-0`}
      ></span>
    </button>
  );
};

export default Menu;
