import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const normalizeTechName = (tech: string) => {
  // First, trim whitespace and convert to lowercase
  const key = tech.trim().toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  
  // Additional mapping for common technologies not in the mappings object
  const additionalMappings: Record<string, string> = {
    "java": "java",
    "python": "python",
    "sql": "postgresql", // Using postgresql icon for SQL
    "django": "djangorest",
    "linux": "linux"
  };
  
  // Check in main mappings first, then additional mappings
  return mappings[key as keyof typeof mappings] || additionalMappings[key] || null;
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

  return logoURLs;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};
