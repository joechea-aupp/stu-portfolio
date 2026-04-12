export const DEFAULT_STUDENT_IMAGE_URL =
  "/images/default-profile-avatar.svg";

export const DEFAULT_ADMINISTRATION_IMAGE_URL =
  "/images/default-profile-avatar.svg";

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
