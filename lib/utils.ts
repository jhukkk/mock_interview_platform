import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const techIconBaseURL = "https://cdn.jsdelivr.net/npm/devicons@latest/icons";

const getDeviconUrl = (slug: string) =>
  `${techIconBaseURL}/${slug}/${slug}-original.svg`;

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    const url = normalized ? `/icons/${normalized}-original.svg` : "/tech.svg";
    console.log(`Tech: ${tech}, Normalized: ${normalized}, URL: ${url}`);
    return {
      tech,
      url,
    };
  });

  // No need to check if files exist in public folder as they are directly accessible
  return logoURLs;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};
