type SeedStudent = {
  id: string;
  name: string;
  major: string;
  year: "freshman" | "sophomore" | "junior" | "senior";
  available: boolean;
  summary: string;
  imageUrl: string;
  skills: string[];
  projects: Array<{ period: string; title: string; details: string }>;
  achievements: Array<{ period: string; title: string; details: string }>;
};

export const students: SeedStudent[] = [
  {
    id: "sreypov-chan",
    name: "Sreypov Chan",
    major: "Computer Science",
    year: "junior",
    available: true,
    summary: "Frontend-focused student building accessible web applications with React and TypeScript.",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
    skills: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    projects: [
      {
        period: "Jan 2026 - Mar 2026",
        title: "Campus Event Hub",
        details: "Built a responsive events platform with role-based dashboards and attendance tracking.",
      },
    ],
    achievements: [
      {
        period: "2025",
        title: "Top 5 at University Hackathon",
        details: "Led the frontend implementation for a student collaboration app prototype.",
      },
    ],
  },
  {
    id: "dara-sok",
    name: "Dara Sok",
    major: "Software Engineering",
    year: "senior",
    available: false,
    summary: "Backend-oriented student focused on API design, data modeling, and system reliability.",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
    skills: ["Node.js", "Prisma", "MySQL", "Docker"],
    projects: [
      {
        period: "Sep 2025 - Dec 2025",
        title: "Scholarship Workflow Service",
        details: "Implemented approval pipelines, audit logs, and notification workers for scholarship applications.",
      },
    ],
    achievements: [
      {
        period: "2024",
        title: "Department Merit Scholarship",
        details: "Awarded for consistent GPA performance and mentoring junior students.",
      },
    ],
  },
];
