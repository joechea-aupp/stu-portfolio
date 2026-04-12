export const PREDEFINED_MAJORS = [
  "Bachelor of Science in Business",
  "Bachelor of Science in Business Administration",
  "Bachelor of Arts in Communication",
  "Bachelor of Arts in Information Science and eSociety",
  "Bachelor of Arts in International Relations and Diplomacy",
  "Bachelor of Science in Political Science",
  "Bachelor of Arts in Law",
  "Bachelor of Science in Artificial Intelligence",
  "Bachelor of Science in Cybersecurity",
  "Bachelor of Science in Digital Infrastructure",
  "Bachelor of Science in Information and Communications Technology",
  "Bachelor of Science in Software Development",
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Systems",
  "Bachelor of Science in Web and Mobile Application Development",
] as const;

const LEGACY_MAJOR_ALIASES: Record<string, string> = {
  "Computer Science": "Bachelor of Science in Computer Science",
  "Software Engineering": "Bachelor of Science in Software Development",
};

export function stripParenthetical(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeMajorName(value: string): string {
  const normalized = stripParenthetical(value.trim());
  return LEGACY_MAJOR_ALIASES[normalized] ?? normalized;
}

export function isPredefinedMajor(value: string): boolean {
  return PREDEFINED_MAJORS.includes(value as (typeof PREDEFINED_MAJORS)[number]);
}
