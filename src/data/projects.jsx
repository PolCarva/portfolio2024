import { BG_IMG } from "../constants/backgrounds";

import comingSoonImg from "../assets/images/proyects/comingsoon.png";
import darioImg from "../assets/images/proyects/dariospain.png";
import hotelAndTravelImg from "../assets/images/proyects/hotelandtravel.png";
import dropperImg from "../assets/images/proyects/dropper.png";
import triviaChallengeImg from "../assets/images/proyects/triviachallenge.png";
import twitterCloneImg from "../assets/images/proyects/twitterclone.png";

export const projects = [
  {
    name: "Multimedia Social Media",
    bg: BG_IMG.bg_1,
    img: comingSoonImg,
    link: "#",
    year: 2024,
    tools: ["Backend", "MongoDB", "Node", "React", "Redux", "Tailwind"],
    size: "big",
    inactive: true,
  },
  {
    name: "Darío Spain",
    bg: BG_IMG.bg_2,
    img: darioImg,
    link: "https://dariospain.netlify.app/",
    year: 2023,
    tools: ["React", "Tailwind", "Figma", "Team Work", "Real Client"],
    size: "small",
  },
  {
    name: "Hotel & Travel",
    bg: BG_IMG.bg_3,
    img: hotelAndTravelImg,
    link: "https://hotelandtravel.vercel.app/",
    year: 2023,
    tools: ["APIs", "React", "Tailwind", "Zustand"],
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
    name: "Trivia Challenge",
    bg: BG_IMG.bg_5,
    img: triviaChallengeImg,
    link: "https://triviachallenge.vercel.app/",
    year: 2023,
    tools: ["APIs", "Game", "React", "Tailwind", "Zustand"],
    size: "big",
  },
  {
    name: "Twitter Clone",
    bg: BG_IMG.bg_6,
    img: twitterCloneImg,
    link: "https://clone-social-media.netlify.app/login",
    year: 2023,
    tools: ["IN MAINTENANCE", "Node", "Backend", "React", "Redux", "Tailwind"],
    size: "small",
  },
];
