export type AcademicYear = "freshman" | "sophomore" | "junior" | "senior";

export type ThemeName = "classic" | "slate" | "sunrise";

export interface TimelineItem {
  period: string;
  title: string;
  details?: string;
}

export interface Student {
  id: string;
  name: string;
  year: AcademicYear;
  major: string;
  skills: string[];
  available: boolean;
  gpa: number;
  projects: TimelineItem[];
  achievements: TimelineItem[];
  summary: string;
  imageUrl: string;
}

export interface FilterState {
  query: string;
  majors: string[];
  availableOnly: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}
