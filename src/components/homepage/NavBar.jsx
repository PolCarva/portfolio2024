import React, { useEffect, useRef } from "react";
import { gsap } from "gsap/gsap-core";

import { navItems } from "../../data/navItems";

const NavBar = () => {

  return (
    <header
      id="nav"
      className="z-40 absolute top-0 flex w-full items-baseline justify-between p-5 md:px-10"
    >
      {/* Logo */}
      <a href="#hero" id="logo">
        <img src="/img/logo.png" alt="Polcar" className="h-8" />
      </a>

      {/* Available */}
      <p id="availability" className="hidden md:block font-extrabold md:text-center text-secondary">
        AVAILABLE FOR WORK
      </p>

      {/* Menu */}
      <nav className="flex space-y-3 flex-col items-end text-right font-grotesk font-medium text-xl">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="nav-link flex flex-col w-fit h-7 overflow-hidden group"
          >
            <span className="group-hover:-translate-y-full transition">
              {item.name}
            </span>
            <span className="group-hover:-translate-y-full transition">
              {item.name}
            </span>
          </a>
        ))}
      </nav>
    </header>
  );
};
export default NavBar;
