import React from "react";
const navigationItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Projects",
    href: "#projects",
  },
  {
    name: "About",
    href: "#about",
  },
  {
    name: "Contact",
    href: "#contact",
  },
];

const socialItems = [
  {
    name: "Linkedin",
    href: "https://www.linkedin.com/in/pablo-carvalho-gimenez",
  },
  {
    name: "Github",
    href: "https://github.com/PolCarva",
  },
  {
    name: "Blog",
    href: "https://multimediasocialmedia.vercel.app/",
  },
];

const Footer = () => {
  return (
    <footer className="p-5 md:px-0 w-full md:w-9/12 mx-auto flex items-end justify-between">
      <div className="grid grid-cols-3 gap-y-7 lg:gap-y-10 md:grid-cols-6 w-full">
        <div className="col-span-2 md:col-span-3 lg:col-span-2 flex flex-col">
          <span className="flex pb-1 font-bold uppercase  text-secondary-600 mb-3">
            Navigation
          </span>
          {navigationItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col w-fit h-7 overflow-hidden group"
            >
              <span className="group-hover:-translate-y-full transition">
                {item.name}
              </span>
              <span className="group-hover:-translate-y-full transition">
                {item.name}
              </span>
            </a>
          ))}
        </div>
        <div className="md:col-span-2  flex flex-col">
          <span className="flex border-b-[1.5px]  border-accent-500 pb-1 font-bold uppercase link-text  text-secondary-600 mb-3">
            Socials
          </span>
          {socialItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex flex-col w-fit  h-7 overflow-hidden group"
            >
              <span className="group-hover:-translate-y-full transition">
                {item.name}
              </span>
              <span className="group-hover:-translate-y-full transition">
                {item.name}
              </span>
            </a>
          ))}
        </div>
        <p className="col-span-2 flex flex-col md:flex-row md:gap-2 md:col-span-6 self-end md:justify-center lg:justify-end items-baseline md:text-end">© Copyright 2024<span className="font-extrabold uppercase text-xl">Pablo Carvalho</span></p>
      </div>
    </footer>
  );
};

export default Footer;
