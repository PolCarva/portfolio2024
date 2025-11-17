import React, { useState } from "react";
import { config } from "../../config/config";

import Heading from "../ui/Heading";
import ContactForm from "../ui/ContactForm";

import { FaLinkedin, FaGithub, FaWhatsapp } from "react-icons/fa";
import { MdArticle } from "react-icons/md";
import { SiGmail } from "react-icons/si";

const Contact = () => {
  const [date, setDate] = useState("");

  setInterval(() => {
    const currentDate = new Date();
    const options = { timeZone: "America/Argentina/Buenos_Aires" }; // UTC-3
    const localTime = currentDate.toLocaleTimeString("en-US", options);

    setDate(localTime);
  }, 1000);

  return (
    <section id="contact" className="mt-16 px-5 md:px-0">
      <Heading title="Contact me" />
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 w-full md:w-9/12 mx-auto pt-10">
        <div className="w-full h-full col-span-4 flex flex-col gap-5">
          <h2 className="text-5xl md:text-6xl font-bold">
            Let's give life to your awesome ideas!
          </h2>
          <p className="font-grotesk text-2xl md:text-4xl">
            {config.availabilitie
              ? `I am currently available for working ${config.timeAvailable}`
              : `I am currently not available for working`}
          </p>
          <ContactForm />
        </div>
        <div className="w-full h-full col-span-4 md:col-span-2 md:order-1 flex flex-col md:grid lg:flex grid-cols-4 gap-10">
          <div className="flex flex-col gap-3 col-span-3">
            <h3 className="text-3xl md:text-4xl font-extrabold">
              Contact Details
            </h3>
            <div className="flex flex-col col-span-3 gap-2">
              <a
                href="mailto:pablocarvalhogimenez@gmail.com"
                className="text-lg md:text-xl flex items-center gap-2"
              >
                <SiGmail className="text-2xl" />
                <span className="text-lg">{config.email}</span>
              </a>
              <a
                href={`whatsapp://send?phone=${config.cellPhone}&text=${config.whatsappMessage}`}
                className="text-lg md:text-xl flex gap-2 items-center"
              >
                <FaWhatsapp className="text-2xl" />
                {config.formattedCellPhone}
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
                  href={config.linkedin}
                  target="_blank"
                  className="text-lg md:text-xl social-link"
                >
                  LinkedIn
                </a>
              </div>
              <div className="flex gap-2 items-center">
                <FaGithub className="text-2xl" />

                <a
                  href={config.github}
                  target="_blank"
                  className="text-lg md:text-xl social-link"
                >
                  Github
                </a>
              </div>
              {config.blog && (
                <div className="flex gap-2 items-center">
                  <MdArticle className="text-2xl" />
                  <a
                    href={config.blog}
                    target="_blank"
                    className="text-lg md:text-xl social-link"
                  >
                    Blog
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 col-span-4">
            <h3 className="text-3xl md:text-4xl font-extrabold">Location</h3>
            <div className="flex flex-col gap-2">
              <p className="text-lg md:text-xl">Montevideo, Uruguay</p>
              <p className="flex flex-col md:flex-row gap-2">
                <span className="text-xl md:text-2xl">{date}</span>
                <span className="text-xl md:text-2xl">(GMT-3)</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
