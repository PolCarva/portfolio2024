import React from "react";
import Heading from "../ui/Heading";

import { FaLinkedin, FaGithub } from "react-icons/fa";
import { MdArticle } from "react-icons/md";

const Contact = () => {
  return (
    <section id="contact" className="mt-16 px-5 md:px-0">
      <Heading title="Contact me" />
      <div className="grid grid-cols-1 md:grid-cols-6 gap-10 w-full md:w-9/12 mx-auto pt-10">
        <div className="w-full h-full col-span-4 flex flex-col gap-5">
          <h2 className="text-5xl md:text-6xl font-bold">
            Let's give life to your awesome ideas!
          </h2>
          <p className="font-grotesk text-2xl md:text-4xl">
            I am currently available for working part-time.
          </p>
          <form>
            <div className="flex flex-col gap-5">
              <input
                type="text"
                placeholder="your name"
                className="w-full h-14 border-b-secondary border-b px-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
              />
              <input
                type="email"
                placeholder="your email"
                className="w-full h-14 border-b-secondary border-b px-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
              />
              <textarea
                placeholder="your message"
                className="w-full min-h-[4.5rem] max-h-52 border-b-secondary border-b p-5 bg-transparent text-body font-grotesk text-xl placeholder:text-secondary-500"
              ></textarea>

              <button
                type="submit"
                className="w-full md:w-4/12 h-14 bg-secondary text-primary rounded-full font-medium uppercase hover:scale-95 transition text-xl"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
        <div className="w-full h-full col-span-2 md:order-1 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h3 className="text-3xl md:text-4xl font-extrabold">
              Contact Details
            </h3>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:pablocarvalhogimenez@gmail.com"
                className="text-xl"
              >
                pablocarvalhogimenez@gmail.com
              </a>
              <a href="phone:+598094375127" className="text-xl">
                (+598) 094 375 127
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-3xl md:text-4xl font-extrabold">
              Social Media
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <FaLinkedin className="text-2xl" />
                <a
                  href="https://www.linkedin.com/in/pablo-carvalho-gimenez"
                  target="_blank"
                  className="text-xl"
                >
                  LinkedIn
                </a>
              </div>
              <div className="flex gap-2 items-center">
                <FaGithub className="text-2xl" />

                <a
                  href="https://github.com/PolCarva"
                  target="_blank"
                  className="text-xl"
                >
                  Github
                </a>
              </div>
              <div className="flex gap-2 items-center">
                <MdArticle className="text-2xl" />
                <a
                  href="https://github.com/PolCarva"
                  target="_blank"
                  className="text-xl"
                >
                  Blog
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
