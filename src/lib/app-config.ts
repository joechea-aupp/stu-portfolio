const configuredAppName = process.env.NEXT_PUBLIC_APP_NAME?.trim();

export const APP_NAME = configuredAppName && configuredAppName.length > 0 ? configuredAppName : "EagleHUB";
