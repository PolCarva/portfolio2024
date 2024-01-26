import React, { useState } from "react";
import MenuBtn from "../ui/MenuBtn";

import { navItems } from "../../data/navItems";

const Menu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <MenuBtn isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(false);
        }}
        className={`${
          isMenuOpen ? "bg-opacity-65 flex" : "bg-opacity-0 hidden"
        } z-40 h-screen transition w-svw fixed top-0 left-0 bg-accent-300 cursor-pointer`}
      ></div>
      <div
        className={`${
          isMenuOpen ? "translate-x-0" : "-translate-x-full opacity-0"
        } transition noise md:rounded-lg !duration-500 overflow-hidden w-full h-full md:w-1/3 z-[998] fixed bg-accent-400 md:h-[calc(100%-2em)] md:top-1/2 md:left-5 md:-translate-y-1/2`}
      >
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          <div className="absolute w-9/12 md:w-2/3 aspect-square rounded-full -top-1/2 right-0 translate-x-[50%] translate-y-[70%] bg-secondary-500 opacity-80"></div>
          <div className="absolute w-9/12 md:w-2/3 aspect-square rounded-full -top-1/2 right-0 translate-x-[40%] translate-y-[60%] bg-accent-300 opacity-80"></div>
          <div className="w-1/2 z-50 flex flex-col gap-10">
            {navItems.map((item) => (
              <div key={"menu-item-" + item.name}>
                <a
                  onClick={() => setIsMenuOpen(false)}
                  href={item.href}
                  className="w-fit hover:ml-4 transition font-extrabold text-primary text-6xl cursor-pointer"
                >
                  {item.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
