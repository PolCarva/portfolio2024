import { BG_IMG } from "../constants/backgrounds";

import comingSoonImg from "../assets/images/projects/comingsoon.png";
//import aipersondetection from "../assets/images/projects/aipersondetection.png";
//import darioImg from "../assets/images/projects/dariospain.png";
//import dropperImg from "../assets/images/projects/dropper.png";
//import triviaChallengeImg from "../assets/images/projects/triviachallenge.png";
//import twitterCloneImg from "../assets/images/projects/twitterclone.png";
//import oldPortfolioImg from "../assets/images/projects/oldportfolio.png";
import wordleinfinitoImg from "../assets/images/projects/wordleinfinito.png"
import jandjimg from "../assets/images/projects/jandj.png"
import lunolifeImg from "../assets/images/projects/lunolife.png"
import nsGcorpImg from "../assets/images/projects/nsgcorp.png"

export const projects = [
  {
    name: "Jack & Jones",
    bg: BG_IMG.bg_2,
    img: jandjimg,
    link: "https://jackjones.com.uy/",
    year: 2025,
    tools: ["Shopify", "Liquid", "Tailwind"],
    inactive: false,
  },
  {
    name: "Luno",
    bg: BG_IMG.bg_3,
    img: lunolifeImg,
    link: "https://lunolife.com/",
    year: 2025,
    tools: ["Shopify", "Liquid", "Tailwind"],
    inactive: false,
  },
  {
    name: "NSGCorp",
    bg: BG_IMG.bg_3,
    img: nsGcorpImg,
    link: "https://www.nsgcorp.me/",
    year: 2024,
    tools: [ "Headless CMS", "Next", "Figma", "Tailwind", "GSAP", "UX/UI"],
    inactive: false,
  },
  {
    name: "Wordle Infinito",
    bg: BG_IMG.bg_3,
    img: wordleinfinitoImg,
    link: "https://wordleinfinito.com/",
    year: 2025,
    tools: ["Next", "Typescript", "MongoDB", "Node", "WebSocket", "Express", "Tailwind", "Shadcn"],
    inactive: false,
  },
  

  {
    name: "Resumidas Cuentas",
    bg: BG_IMG.bg_1,
    img: comingSoonImg,
    link: "#",
    year: 2025,
    tools: ["AI", "Next", "Typescript", "MongoDB", "Node", "Express", "Tailwind", "Shadcn"],
    inactive: true,
  },

  /*   {
      name: "Multimedia Social Media",
      bg: BG_IMG.bg_1,
      img: msmImg,
      link: "https://multimediasocialmedia.vercel.app/",
      year: 2024,
      tools: ["Backend", "MongoDB", "Node", "React", "Redux", "React Query", "Tailwind"],
      inactive: false,
    }, */
  /*  {
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
   }, */
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
