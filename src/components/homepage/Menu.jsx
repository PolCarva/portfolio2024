import { useState } from "react";
import MenuBtn from "../ui/MenuBtn";
import cvPdf from "../../assets/documents/Pablo_Carvalho_EN-small.pdf";

import { navItems } from "../../data/navItems";
import { MdArticle, MdOutlineFileDownload } from "react-icons/md";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { config } from "../../config/config";

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
        } z-30 h-screen transition w-svw fixed top-0 left-0 bg-accent-300 `}
      ></div>
      <div
        className={`${
          isMenuOpen ? "translate-x-0" : "-translate-x-full opacity-0"
        } transition noise md:rounded-lg !duration-500 overflow-hidden w-full h-full md:w-[calc(100%-2em)] lg:w-1/3 z-[998] fixed bg-accent-400 md:h-[calc(100%-2em)] md:top-1/2 md:left-5 md:-translate-y-1/2`}
      >
        <div className="relative w-full h-full flex flex-col justify-center items-center">
          <div className="absolute w-9/12 md:w-2/3 aspect-square rounded-full -top-1/2 right-0 translate-x-[50%] translate-y-[70%] bg-secondary-500 opacity-80"></div>
          <div className="absolute w-9/12 md:w-2/3 aspect-square rounded-full -top-1/2 right-0 translate-x-[40%] translate-y-[60%] bg-accent-300 opacity-80"></div>
          <div className="w-1/2 z-40 flex flex-col gap-10">
            {navItems.map((item) => (
              <div key={"menu-item-" + item.name}>
                <a
                  onClick={() => setIsMenuOpen(false)}
                  href={item.href}
                  className="w-fit hover:ml-4 transition font-extrabold text-primary text-6xl "
                >
                  {item.name}
                </a>
              </div>
            ))}
          </div>
          <div className="absolute w-full justify-between md:justify-end flex gap-5 text-sm md:text-lg text-primary bottom-0 md:right-0 p-5">
            <a
              href={config.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-secondary-400 transition"
            >
              <FaLinkedin className="text-xl md:text-xl" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com/PolCarva"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-secondary-400 transition"
            >
              <FaGithub className="text-xl md:text-xl" />
              <span>Github</span>
            </a>
            <a
              href="https://multimediasocialmedia.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-secondary-400 transition"
            >
              <MdArticle className="text-xl md:text-xl" />
              <span>Blog</span>
            </a>
            <a
              href={cvPdf}
              download="Pablo_Carvalho_EN.pdf"
              className="flex items-center gap-2 hover:text-secondary-400 transition"
            >
              <span>Resume</span>
              <MdOutlineFileDownload className="text-xl md:text-xl" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
