import type { AcademicYear, Student } from "@/types/student";

export const students: Student[] = [
  {
    id: "lukas-weber",
    name: "Lukas Weber",
    year: "senior",
    major: "Architecture & Design",
    skills: ["SketchUp", "Urban Systems", "Concept Development"],
    available: true,
    gpa: 3.7,
    summary:
      "Focusing on sustainable urban modular living systems and brutalist concrete aesthetics.",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80",
  },
  {
    id: "sami-al-farsi",
    name: "Sami Al-Farsi",
    year: "junior",
    major: "Strategic Management",
    skills: ["Behavioral Economics", "Analytics", "Research"],
    available: false,
    gpa: 3.5,
    summary:
      "Exploring the intersection of behavioral economics and high-tech manufacturing.",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80",
  },
  {
    id: "erik-janson",
    name: "Erik Janson",
    year: "sophomore",
    major: "Robotics Engineering",
    skills: ["Embedded Systems", "Control Loops", "Python"],
    available: true,
    gpa: 3.4,
    summary:
      "Developing low-cost autonomous drone platforms for agricultural monitoring.",
    imageUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80",
  },
  {
    id: "elena-rossi",
    name: "Elena Rossi",
    year: "senior",
    major: "Fine Arts & Theory",
    skills: ["Digital Sculpture", "Installation", "Creative Direction"],
    available: true,
    gpa: 3.8,
    summary:
      "Mastering digital sculpture and new media installation in public spaces.",
    imageUrl:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=640&q=80",
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    year: "senior",
    major: "Industrial Design",
    skills: ["Prototyping", "Human Factors", "CAD"],
    available: true,
    gpa: 3.6,
    summary:
      "Prototyping ergonomic workstations for remote-first environments.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
  },
  {
    id: "nora-kim",
    name: "Nora Kim",
    year: "junior",
    major: "Computer Science",
    skills: ["Next.js", "TypeScript", "Design Systems"],
    available: true,
    gpa: 3.9,
    summary:
      "Building high-performance front-end systems with a strong accessibility focus.",
    imageUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&q=80",
  },
];

export const yearOptions: { label: string; value: AcademicYear }[] = [
  { label: "Freshman", value: "freshman" },
  { label: "Sophomore", value: "sophomore" },
  { label: "Junior", value: "junior" },
  { label: "Senior", value: "senior" },
];

export const majorOptions = [
  "Architecture & Design",
  "Strategic Management",
  "Robotics Engineering",
  "Fine Arts & Theory",
  "Industrial Design",
  "Computer Science",
];

export const skillOptions = [
  "SketchUp",
  "Urban Systems",
  "Concept Development",
  "Behavioral Economics",
  "Analytics",
  "Research",
  "Embedded Systems",
  "Control Loops",
  "Python",
  "Digital Sculpture",
  "Installation",
  "Creative Direction",
  "Prototyping",
  "Human Factors",
  "CAD",
  "Next.js",
  "TypeScript",
  "Design Systems",
];
