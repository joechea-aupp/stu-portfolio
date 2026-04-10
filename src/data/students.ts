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
    projects: [
      { period: "2023", title: "Concrete Commons: Community Courtyard Prototype" },
      { period: "2024", title: "Transit Weave: Mixed-use Mobility Node Concept" },
      { period: "2025", title: "ModuCity: Modular Micro-Housing Atlas" },
    ],
    achievements: [
      {
        period: "2025",
        title: "Top 3 in the Sustainable Campus Design Challenge",
        verifiedBy: { name: "Prof. Hanna Müller", role: "Architecture Faculty" },
      },
      { period: "2025", title: "Invited speaker at Student Urban Futures Day" },
    ],
    summary:
      "Focusing on sustainable urban modular living systems and brutalist concrete aesthetics.",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      linkedin: "https://linkedin.com/in/lukas-weber",
      github: "https://github.com/lukas-weber",
    },
  },
  {
    id: "sami-al-farsi",
    name: "Sami Al-Farsi",
    year: "junior",
    major: "Strategic Management",
    skills: ["Behavioral Economics", "Analytics", "Research"],
    available: false,
    gpa: 3.5,
    projects: [
      { period: "2024", title: "FactoryChoice: Decision Bias Survey Platform" },
      { period: "2025", title: "NudgeLab: Pricing Behavior Simulation" },
    ],
    achievements: [
      { period: "2025", title: "Presented findings at the Undergraduate Strategy Forum" },
      {
        period: "2025",
        title: "Published in the School of Management research digest",
        verifiedBy: { name: "Dr. Leila Okonkwo", role: "Associate Dean, Management" },
      },
    ],
    summary:
      "Exploring the intersection of behavioral economics and high-tech manufacturing.",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      linkedin: "https://linkedin.com/in/sami-alfarsi",
      instagram: "https://instagram.com/sami.alfarsi",
    },
  },
  {
    id: "erik-janson",
    name: "Erik Janson",
    year: "sophomore",
    major: "Robotics Engineering",
    skills: ["Embedded Systems", "Control Loops", "Python"],
    available: true,
    gpa: 3.4,
    projects: [
      { period: "2024", title: "WindHold: Stable PID Flight Controller" },
      { period: "2025", title: "SoilSense Rover: Edge Monitoring Unit" },
      { period: "2026", title: "AgriScout: Autonomous Field Drone" },
    ],
    achievements: [
      {
        period: "2025",
        title: "Won Best Prototype in Robotics Build Week",
        verifiedBy: { name: "Prof. Adam Kowalski", role: "Robotics Engineering Faculty" },
      },
      {
        period: "2026",
        title: "Secured faculty grant for field testing",
        verifiedBy: { name: "Dr. Sandra Reyes", role: "Research Grants Office" },
      },
    ],
    summary:
      "Developing low-cost autonomous drone platforms for agricultural monitoring.",
    imageUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      github: "https://github.com/erik-janson",
      linkedin: "https://linkedin.com/in/erik-janson",
    },
  },
  {
    id: "elena-rossi",
    name: "Elena Rossi",
    year: "senior",
    major: "Fine Arts & Theory",
    skills: ["Digital Sculpture", "Installation", "Creative Direction"],
    available: true,
    gpa: 3.8,
    projects: [
      { period: "2024", title: "Echo Walls: Motion-Reactive Projection Space" },
      { period: "2025", title: "Resonant Bodies: AR Sculpture Installation" },
    ],
    achievements: [
      {
        period: "2025",
        title: "Featured in the City Public Arts Showcase",
        verifiedBy: { name: "Marco Delgado", role: "Curator, City Arts Foundation" },
      },
      { period: "2026", title: "Received Emerging Artist residency support" },
    ],
    summary:
      "Mastering digital sculpture and new media installation in public spaces.",
    imageUrl:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      instagram: "https://instagram.com/elena.rossi.art",
      facebook: "https://facebook.com/elenarossiart",
    },
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    year: "senior",
    major: "Industrial Design",
    skills: ["Prototyping", "Human Factors", "CAD"],
    available: true,
    gpa: 3.6,
    projects: [
      { period: "2023", title: "TaskArc: Adjustable Monitor Arm Platform" },
      { period: "2024", title: "QuietDock: Portable Acoustic Desk Shield" },
      { period: "2025", title: "FlexFrame: Adaptive Workstation System" },
    ],
    achievements: [
      { period: "2025", title: "Runner-up in the Industrial Design Capstone Expo" },
      { period: "2026", title: "Filed a provisional ergonomic fixture patent" },
    ],
    summary:
      "Prototyping ergonomic workstations for remote-first environments.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      linkedin: "https://linkedin.com/in/marcus-chen",
    },
  },
  {
    id: "nora-kim",
    name: "Nora Kim",
    year: "junior",
    major: "Computer Science",
    skills: ["Next.js", "TypeScript", "Design Systems"],
    available: true,
    gpa: 3.9,
    projects: [
      { period: "2024", title: "FocusFlow: Keyboard-first Study Planner" },
      { period: "2025", title: "TokenForge: Theming System Builder" },
      { period: "2026", title: "A11yPulse: Accessibility Monitoring Dashboard" },
    ],
    achievements: [
      {
        period: "2025",
        title: "1st place at University Hack Week UI track",
        verifiedBy: { name: "Yuki Tanaka", role: "Senior Engineer, Vercel" },
      },
      {
        period: "2026",
        title: "Dean's Innovation Award for Front-end Engineering",
        verifiedBy: { name: "Prof. Claire Fontaine", role: "Dean of Engineering" },
      },
    ],
    summary:
      "Building high-performance front-end systems with a strong accessibility focus.",
    imageUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      github: "https://github.com/nora-kim",
      linkedin: "https://linkedin.com/in/nora-kim",
      instagram: "https://instagram.com/nora.kim.dev",
    },
  },
  {
    id: "maya-castillo",
    name: "Maya Castillo",
    year: "senior",
    major: "Computer Science",
    skills: ["Distributed Systems", "Product Engineering", "Mentorship"],
    available: true,
    gpa: 4.0,
    projects: [
      { period: "2024", title: "CampusPulse: Real-time Student Event Platform" },
      { period: "2025", title: "PeerGrid: Collaborative Learning Matchmaker" },
      { period: "2026", title: "SignalStack: Student Portfolio Analytics Suite" },
    ],
    achievements: [
      {
        period: "2024",
        title: "Won University Hackathon Grand Prize",
        verifiedBy: { name: "Alicia Moore", role: "Director of Innovation Programs" },
      },
      {
        period: "2024",
        title: "Selected as Engineering Student Ambassador",
        verifiedBy: { name: "Prof. Daniel Hart", role: "College of Engineering" },
      },
      {
        period: "2024",
        title: "Published open-source design system adopted by three student teams",
        verifiedBy: { name: "Noah Bennett", role: "Lead Front-end Mentor" },
      },
      {
        period: "2025",
        title: "Presented scalable system design research at regional symposium",
        verifiedBy: { name: "Dr. Priya Raman", role: "Research Advisor" },
      },
      {
        period: "2025",
        title: "Received Dean's Award for Technical Leadership",
        verifiedBy: { name: "Prof. Claire Fontaine", role: "Dean of Engineering" },
      },
      {
        period: "2025",
        title: "Mentored freshman dev cohort with 95% project completion rate",
        verifiedBy: { name: "Ethan Brooks", role: "Program Coordinator" },
      },
      {
        period: "2025",
        title: "Built internal tooling for the student incubator",
        verifiedBy: { name: "Sara Lopez", role: "Startup Lab Manager" },
      },
      {
        period: "2025",
        title: "Top speaker at Women in Computing Summit",
        verifiedBy: { name: "Helena Ortiz", role: "Summit Chair" },
      },
      {
        period: "2026",
        title: "Secured research grant for applied AI advising tools",
        verifiedBy: { name: "Dr. Marcus Lee", role: "Research Funding Committee" },
      },
      {
        period: "2026",
        title: "Named Student Builder of the Year",
        verifiedBy: { name: "Jasmine Cole", role: "VP, Student Affairs" },
      },
      {
        period: "2026",
        title: "Launched a campus-wide portfolio review platform",
        verifiedBy: { name: "Victor Nguyen", role: "Director of Digital Learning" },
      },
    ],
    summary:
      "Shipping polished campus-scale products while leading peer engineering initiatives and systems design programs.",
    imageUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      github: "https://github.com/maya-castillo",
      linkedin: "https://linkedin.com/in/maya-castillo",
    },
  },
  {
    id: "aisha-thompson",
    name: "Aisha Thompson",
    year: "junior",
    major: "Computer Science",
    skills: ["Next.js", "TypeScript", "Design Systems"],
    available: true,
    gpa: 3.8,
    projects: [
      { period: "2024", title: "StudioKit: Shared UI Pattern Library" },
      { period: "2025", title: "PeerPort: Student Portfolio Review Hub" },
      { period: "2026", title: "SignalBoard: Real-time Club Analytics Dashboard" },
    ],
    achievements: [
      {
        period: "2024",
        title: "Won best front-end build at Campus Dev Sprint",
        verifiedBy: { name: "Mina Alvarez", role: "Engineering Program Lead" },
      },
      {
        period: "2024",
        title: "Selected to lead the student design systems guild",
        verifiedBy: { name: "Prof. Claire Fontaine", role: "Dean of Engineering" },
      },
      {
        period: "2025",
        title: "Published an accessibility checklist adopted by three capstone teams",
        verifiedBy: { name: "Jordan Patel", role: "Accessibility Mentor" },
      },
      {
        period: "2025",
        title: "Presented interface scaling patterns at the regional web summit",
        verifiedBy: { name: "Naomi Brooks", role: "Conference Curator" },
      },
      {
        period: "2026",
        title: "Released a reusable dashboard template for campus organizations",
      },
      {
        period: "2026",
        title: "Received the student product craftsmanship award",
        verifiedBy: { name: "Elliot Rivera", role: "Director of Student Innovation" },
      },
    ],
    summary:
      "Designing accessible front-end systems and reusable interface tooling for student-led products.",
    imageUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=640&q=80",
    socialLinks: {
      github: "https://github.com/aisha-thompson",
      linkedin: "https://linkedin.com/in/aisha-thompson",
      instagram: "https://instagram.com/aisha.thompson.dev",
    },
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
