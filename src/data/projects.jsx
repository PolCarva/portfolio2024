import { BG_IMG } from "../constants/backgrounds";

//import comingSoonImg from "../assets/images/projects/comingsoon.png";
//import aipersondetection from "../assets/images/projects/aipersondetection.png";
import darioImg from "../assets/images/projects/dariospain.png";
import hotelAndTravelImg from "../assets/images/projects/hotelandtravel.png";
import dropperImg from "../assets/images/projects/dropper.png";
import triviaChallengeImg from "../assets/images/projects/triviachallenge.png";
//import twitterCloneImg from "../assets/images/projects/twitterclone.png";
import msmImg from "../assets/images/projects/msm.png";
import oldPortfolioImg from "../assets/images/projects/oldportfolio.png";

export const projects = [
  {
    name: "Multimedia Social Media",
    bg: BG_IMG.bg_1,
    img: msmImg,
    link: "https://multimediasocialmedia.vercel.app/",
    year: 2024,
    tools: ["Backend", "MongoDB", "Node", "React", "Redux", "React Query", "Tailwind"],
    inactive: false,
  },
  {
    name: "Hotel & Travel",
    bg: BG_IMG.bg_4,
    img: hotelAndTravelImg,
    link: "https://hotelandtravel.vercel.app/",
    year: 2023,
    tools: ["APIs", "React", "Tailwind", "Zustand"],
  },
  {
    name: "Darío Spain",
    bg: BG_IMG.bg_3,
    img: darioImg,
    link: "https://dariospain.netlify.app/",
    year: 2023,
    tools: ["React", "Tailwind", "Figma", "Team Work", "Real Client"],
  },
  {
    name: "Dropper",
    bg: BG_IMG.bg_5,
    img: dropperImg,
    link: "https://droppershop.netlify.app/",
    year: 2023,
    tools: ["Firebase", "Stock", "Shopping Cart", "React", "CSS"],
  },
  {
    name: "Trivia Challenge",
    bg: BG_IMG.bg_6,
    img: triviaChallengeImg,
    link: "https://triviachallenge.vercel.app/",
    year: 2023,
    tools: ["APIs", "Game", "React", "Tailwind", "Zustand"],
  },

     {
    name: "Portfolio 2023",
    bg: BG_IMG.bg_5,
    img: oldPortfolioImg,
    link: "https://pablo-carvalho.web.app/",
    year: 2023,
    tools: ["Javascript", "HTML", "CSS", "GSAP"],
  },
 /*     {
    name: "AI Person Detection",
    bg: BG_IMG.bg_2,
    img: aipersondetection,
    link: "https://person-detection-ia.vercel.app/",
    year: 2024,
    tools: ["not working on iOS","AI", "Next.js", "Typescript", "Tailwind"],
    inactive: true,
  },  */
];
