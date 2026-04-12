const configuredAppName = process.env.NEXT_PUBLIC_APP_NAME?.trim();

export const APP_NAME = configuredAppName && configuredAppName.length > 0 ? configuredAppName : "EagleHUB";

const DEFAULT_APP_URL = "http://localhost:3000";

function normalizeAppUrl(value: string | undefined): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_APP_URL;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export const APP_BASE_URL = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

export function buildAbsoluteUrl(path: string): string {
  return new URL(path, APP_BASE_URL).toString();
}
