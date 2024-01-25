import React, { useEffect, useRef } from "react";
import { gsap } from "gsap/gsap-core";

const navItems = [
  {
    name: "projects",
    href: "#projects",
  },
  {
    name: "about",
    href: "#about",
  },
  {
    name: "skills",
    href: "#skills",
  },
  {
    name: "contact",
    href: "#contact",
  },
];

const NavBar = () => {
  const navRef = useRef();

  useEffect(() => {
    gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }, []);

  return (
    <header
      ref={navRef}
      id="nav"
      className="z-50 absolute top-0 flex w-full items-baseline justify-between p-5 md:px-10"
    >
      {/* Logo */}
      <a href="#hero">
        <img src="/img/logo.png" alt="Polcar" className="h-8" />
      </a>

      {/* Available */}
      <p className="hidden md:block font-extrabold md:text-center text-secondary">
        AVAILABLE FOR WORK
      </p>

      {/* Menu */}
      <nav className="flex space-y-3 flex-col items-end text-right font-grotesk font-medium text-xl">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col w-fit cursor-pointer h-7 overflow-hidden group"
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
