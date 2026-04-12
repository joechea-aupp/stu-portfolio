export type AcademicYear = "freshman" | "sophomore" | "junior" | "senior";

export type UserType = "STUDENT" | "ADMINISTRATION";

export type AdministrationTitle = "MR" | "MS" | "DR";

export type AdministrationGender = "Male" | "Female";

export type ThemeName = "classic" | "slate" | "sunrise";

export interface Verifier {
  name: string;
  role: string;
}

export interface TimelineItem {
  period: string;
  title: string;
  details?: string;
  verifiedBy?: Verifier;
  pendingVerification?: {
    requestedAt: string;
    verifierUserId: number;
    verifierName: string;
  };
  /** URL-safe identifier used to route to the item's detail page. */
  slug?: string;
  /** Full markdown content for the item's detail page. */
  body?: string;
}

export interface SocialLinks {
  linkedin?: string;
  facebook?: string;
  github?: string;
  instagram?: string;
}

export interface Student {
  id: string;
  name: string;
  year: AcademicYear;
  major: string;
  viewCount: number;
  kudoCount: number;
  skills: string[];
  available: boolean;
  projects: TimelineItem[];
  achievements: TimelineItem[];
  summary: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
}

export interface AdministrationProfile {
  occupation: string;
  company: string;
  phoneNumber: string;
  gender: AdministrationGender;
  summary: string;
  profilePicUrl: string;
  title: AdministrationTitle;
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
