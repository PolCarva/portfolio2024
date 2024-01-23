import { BG_IMG } from "../constants/backgrounds";

import comingSoonImg from "../assets/images/proyects/comingsoon.png";
import darioImg from "../assets/images/proyects/dariospain.png";
import hotelAndTravelImg from "../assets/images/proyects/hotelandtravel.png";
import dropperImg from "../assets/images/proyects/dropper.png";
import triviaChallengeImg from "../assets/images/proyects/triviachallenge.png";
import twitterCloneImg from "../assets/images/proyects/twitterclone.png";
import oldPortfolioImg from "../assets/images/proyects/oldportfolio.png";

export const projects = [
  {
    name: "Multimedia Social Media",
    bg: BG_IMG.bg_1,
    img: comingSoonImg,
    link: "https://multimediasocialmedia.vercel.app/",
    year: 2024,
    tools: ["Backend", "MongoDB", "Node", "React", "Redux", "Tailwind"],
    size: "big",
    inactive: true,
  },

  {
    name: "Hotel & Travel",
    bg: BG_IMG.bg_2,
    img: hotelAndTravelImg,
    link: "https://hotelandtravel.vercel.app/",
    year: 2023,
    tools: ["APIs", "React", "Tailwind", "Zustand"],
    size: "small",
  },
  {
    name: "Darío Spain",
    bg: BG_IMG.bg_1,
    img: darioImg,
    link: "https://dariospain.netlify.app/",
    year: 2023,
    tools: ["React", "Tailwind", "Figma", "Team Work", "Real Client"],
    size: "small",
  },
  {
    name: "Dropper",
    bg: BG_IMG.bg_4,
    img: dropperImg,
    link: "https://droppershop.netlify.app/",
    year: 2023,
    tools: ["Firebase", "Stock", "Shopping Cart", "React", "CSS"],
    size: "big",
  },
  {
    name: "Portfolio 2023",
    bg: BG_IMG.bg_5,
    img: oldPortfolioImg,
    link: "https://pablo-carvalho.web.app/",
    year: 2023,
    tools: ["Javascript", "HTML", "CSS", "GSAP"],
    size: "big",
  },
  {
    name: "Trivia Challenge",
    bg: BG_IMG.bg_6,
    img: triviaChallengeImg,
    link: "https://triviachallenge.vercel.app/",
    year: 2023,
    tools: ["APIs", "Game", "React", "Tailwind", "Zustand"],
    size: "small",
  },
];
