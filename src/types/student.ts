export type AcademicYear = "freshman" | "sophomore" | "junior" | "senior";

export type ThemeName = "classic" | "slate" | "sunrise";

export interface Student {
  id: string;
  name: string;
  year: AcademicYear;
  major: string;
  skills: string[];
  available: boolean;
  gpa: number;
  summary: string;
  imageUrl: string;
}

export interface FilterState {
  query: string;
  years: AcademicYear[];
  majors: string[];
  skills: string[];
  availableOnly: boolean;
  minGpa: number;
}

export interface FilterOption {
  label: string;
  value: string;
}
