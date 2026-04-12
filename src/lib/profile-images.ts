export const DEFAULT_STUDENT_IMAGE_URL =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80";

export const DEFAULT_ADMINISTRATION_IMAGE_URL =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=640&q=80";

export function resolveStudentImageUrl(imageUrl: string | null | undefined): string {
  if (typeof imageUrl !== "string") {
    return DEFAULT_STUDENT_IMAGE_URL;
  }

  const trimmed = imageUrl.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_STUDENT_IMAGE_URL;
}

export function resolveAdministrationImageUrl(imageUrl: string | null | undefined): string {
  if (typeof imageUrl !== "string") {
    return DEFAULT_ADMINISTRATION_IMAGE_URL;
  }

  const trimmed = imageUrl.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ADMINISTRATION_IMAGE_URL;
}
