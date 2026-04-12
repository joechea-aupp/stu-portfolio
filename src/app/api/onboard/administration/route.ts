import { cookies } from "next/headers";
import { AdministrationTitle } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import { resolveAdministrationImageUrl } from "@/lib/profile-images";

function parseSessionUserId(rawCookie: string | undefined): string | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

interface AdministrationDraft {
  occupation: string;
  company: string;
  phoneNumber: string;
  gender: "Male" | "Female" | "";
  summary: string;
  profilePicUrl: string;
  title: AdministrationTitle;
}

function normalizeGender(rawGender: unknown): "Male" | "Female" | "" {
  if (typeof rawGender !== "string") {
    return "";
  }

  const normalized = rawGender.trim().toLowerCase();
  if (normalized === "male") {
    return "Male";
  }

  if (normalized === "female") {
    return "Female";
  }

  return "";
}

function normalizeDraft(body: Record<string, unknown>): AdministrationDraft {
  const titleRaw = typeof body.title === "string" ? body.title.trim().toUpperCase() : "";

  return {
    occupation: typeof body.occupation === "string" ? body.occupation.trim() : "",
    company: typeof body.company === "string" ? body.company.trim() : "",
    phoneNumber: typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "",
    gender: normalizeGender(body.gender),
    summary: typeof body.summary === "string" ? body.summary.trim() : "",
    profilePicUrl: typeof body.profilePicUrl === "string" ? body.profilePicUrl.trim() : "",
    title: (Object.values(AdministrationTitle).includes(titleRaw as AdministrationTitle)
      ? titleRaw
      : "MR") as AdministrationTitle,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = parseSessionUserId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      name: true,
      user_type: true,
      administration: {
        select: {
          occupation: true,
          company: true,
          phone_number: true,
          gender: true,
          summary: true,
          profile_pic_url: true,
          title: true,
        },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (user.user_type !== "ADMINISTRATION") {
    return Response.json({ error: "Only administration accounts can access this onboarding flow." }, { status: 403 });
  }

  return Response.json({
    draft: user.administration
      ? {
          occupation: user.administration.occupation,
          company: user.administration.company,
          phoneNumber: user.administration.phone_number,
          gender: user.administration.gender,
          summary: user.administration.summary,
          profilePicUrl: resolveAdministrationImageUrl(user.administration.profile_pic_url),
          title: user.administration.title,
        }
      : null,
    user: { name: user.name },
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = parseSessionUserId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const draft = normalizeDraft(body as Record<string, unknown>);
  const rawGenderProvided =
    typeof (body as Record<string, unknown>).gender === "string" &&
    ((body as Record<string, unknown>).gender as string).trim().length > 0;

  if (rawGenderProvided && !draft.gender) {
    return Response.json({ error: "gender must be Male or Female." }, { status: 400 });
  }

  if (
    !draft.occupation ||
    !draft.company ||
    !draft.phoneNumber ||
    !draft.gender ||
    !draft.summary ||
    !draft.profilePicUrl
  ) {
    return Response.json(
      {
        error:
          "occupation, company, phoneNumber, gender, summary, and profilePicUrl are required.",
      },
      { status: 400 },
    );
  }

  const prisma = getPrismaClient();

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, user_type: true },
  });

  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  if (user.user_type !== "ADMINISTRATION") {
    return Response.json({ error: "Only administration accounts can save this onboarding flow." }, { status: 403 });
  }

  await prisma.administration.upsert({
    where: { user_id: user.id },
    update: {
      occupation: draft.occupation,
      company: draft.company,
      phone_number: draft.phoneNumber,
      gender: draft.gender,
      summary: draft.summary,
      profile_pic_url: draft.profilePicUrl,
      title: draft.title,
    },
    create: {
      user_id: user.id,
      occupation: draft.occupation,
      company: draft.company,
      phone_number: draft.phoneNumber,
      gender: draft.gender,
      summary: draft.summary,
      profile_pic_url: draft.profilePicUrl,
      title: draft.title,
    },
  });

  return Response.json({ saved: true }, { status: 201 });
}
