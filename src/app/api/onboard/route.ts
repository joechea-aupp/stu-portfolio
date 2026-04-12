import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { Classification, Prisma } from "@prisma/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";
import type { SocialLinks } from "@/types/student";

function parseSessionUserId(rawCookie: string | undefined): string | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
}

function normalizeSocialLinkValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normalizeSocialLinks(value: unknown): SocialLinks {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    linkedin: normalizeSocialLinkValue(source.linkedin),
    facebook: normalizeSocialLinkValue(source.facebook),
    github: normalizeSocialLinkValue(source.github),
    instagram: normalizeSocialLinkValue(source.instagram),
  };
}

function hasSocialLinks(value: SocialLinks): boolean {
  return Boolean(value.linkedin || value.facebook || value.github || value.instagram);
}

function toSocialLinksJson(value: SocialLinks) {
  if (!hasSocialLinks(value)) {
    return Prisma.DbNull;
  }

  const json: Record<string, string> = {};

  if (value.linkedin) json.linkedin = value.linkedin;
  if (value.facebook) json.facebook = value.facebook;
  if (value.github) json.github = value.github;
  if (value.instagram) json.instagram = value.instagram;

  return json;
}

function isSocialLinksColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };

  if (candidate.code === "P2022") {
    return true;
  }

  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("social_links") || message.includes("unknown column");
}

function normalizeDraftBody(body: Record<string, unknown>) {
  return {
    major: typeof body.major === "string" ? body.major.trim() : "",
    graduationYear: body.graduationYear,
    year: body.year,
    availableForProject: body.availableForProject,
    summary: body.summary,
    imageUrl: body.imageUrl,
    skills: body.skills,
    projects: body.projects,
    achievements: body.achievements,
    socialLinks: body.socialLinks,
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = parseSessionUserId(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const prisma = getPrismaClient();

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        name: true,
        student: {
          select: {
            major: true,
            graduation_year: true,
            classification: true,
            available_for_project: true,
            summary: true,
            image_url: true,
            social_links: true,
            skills: true,
            projects: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.student) {
      return Response.json({ draft: null, user: { name: user.name } });
    }

    return Response.json({
      draft: {
        name: user.name,
        major: user.student.major,
        graduationYear: String(user.student.graduation_year),
        year: user.student.classification.toLowerCase(),
        availableForProject: user.student.available_for_project,
        summary: user.student.summary ?? "",
        imageUrl: user.student.image_url ?? "",
        skills: Array.isArray(user.student.skills) ? user.student.skills : [],
        projects: Array.isArray(user.student.projects) ? user.student.projects : [],
        achievements: Array.isArray(user.student.achievements) ? user.student.achievements : [],
        socialLinks: normalizeSocialLinks(user.student.social_links),
      },
      user: { name: user.name },
    });
  } catch (error) {
    if (isSocialLinksColumnError(error)) {
      try {
        const fallbackUser = await prisma.users.findUnique({
          where: { id: userId },
          select: {
            name: true,
            student: {
              select: {
                major: true,
                graduation_year: true,
                classification: true,
                available_for_project: true,
                summary: true,
                image_url: true,
                skills: true,
                projects: true,
                achievements: true,
              },
            },
          },
        });

        if (!fallbackUser) {
          return Response.json({ error: "User not found." }, { status: 404 });
        }

        if (!fallbackUser.student) {
          return Response.json({ draft: null, user: { name: fallbackUser.name } });
        }

        return Response.json({
          draft: {
            name: fallbackUser.name,
            major: fallbackUser.student.major,
            graduationYear: String(fallbackUser.student.graduation_year),
            year: fallbackUser.student.classification.toLowerCase(),
            availableForProject: fallbackUser.student.available_for_project,
            summary: fallbackUser.student.summary ?? "",
            imageUrl: fallbackUser.student.image_url ?? "",
            skills: Array.isArray(fallbackUser.student.skills) ? fallbackUser.student.skills : [],
            projects: Array.isArray(fallbackUser.student.projects)
              ? fallbackUser.student.projects
              : [],
            achievements: Array.isArray(fallbackUser.student.achievements)
              ? fallbackUser.student.achievements
              : [],
            socialLinks: {},
          },
          user: { name: fallbackUser.name },
        });
      } catch (fallbackError) {
        const message =
          process.env.NODE_ENV === "development" && fallbackError instanceof Error
            ? fallbackError.message
            : "Unable to load profile draft.";
        console.error("[/api/onboard][GET] Fallback query failed:", fallbackError);
        return Response.json({ error: message }, { status: 500 });
      }
    }

    console.error("[/api/onboard][GET] Unexpected error:", error);
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Unable to load profile draft.";
    return Response.json({ error: message }, { status: 500 });
  }
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

  const { major, graduationYear, year, summary, imageUrl, skills, projects, achievements, availableForProject, socialLinks } = normalizeDraftBody(body as Record<string, unknown>);

  if (!major || !graduationYear || !year) {
    return Response.json({ error: "major, graduationYear, and year are required." }, { status: 400 });
  }

  const classificationKey = String(year).toUpperCase() as Classification;
  if (!Object.values(Classification).includes(classificationKey)) {
    return Response.json({ error: "Invalid year value." }, { status: 400 });
  }

  const gradYearInt = parseInt(String(graduationYear), 10);
  if (isNaN(gradYearInt)) {
    return Response.json({ error: "graduationYear must be a number." }, { status: 400 });
  }

  const prisma = getPrismaClient();
  const normalizedSocialLinks = normalizeSocialLinks(socialLinks);
  const socialLinksPayload = toSocialLinksJson(normalizedSocialLinks);

  try {
    const student = await prisma.student.upsert({
      where: {
        user_id: userId,
      },
      update: {
        major: String(major),
        graduation_year: gradYearInt,
        classification: classificationKey,
        available_for_project: Boolean(availableForProject),
        summary: typeof summary === "string" ? summary : null,
        image_url: typeof imageUrl === "string" ? imageUrl : null,
        social_links: socialLinksPayload,
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        achievements: Array.isArray(achievements) ? achievements : [],
      },
      create: {
        user_id: userId,
        major: String(major),
        graduation_year: gradYearInt,
        classification: classificationKey,
        available_for_project: Boolean(availableForProject),
        summary: typeof summary === "string" ? summary : null,
        image_url: typeof imageUrl === "string" ? imageUrl : null,
        social_links: socialLinksPayload,
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        achievements: Array.isArray(achievements) ? achievements : [],
      },
      select: { id: true, kudo_count: true, view_count: true },
    });

    return Response.json(
      {
        studentId: student.id,
        metrics: {
          kudos: student.kudo_count,
          views: student.view_count,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (isSocialLinksColumnError(error)) {
      try {
        const student = await prisma.student.upsert({
          where: {
            user_id: userId,
          },
          update: {
            major: String(major),
            graduation_year: gradYearInt,
            classification: classificationKey,
            available_for_project: Boolean(availableForProject),
            summary: typeof summary === "string" ? summary : null,
            image_url: typeof imageUrl === "string" ? imageUrl : null,
            skills: Array.isArray(skills) ? skills : [],
            projects: Array.isArray(projects) ? projects : [],
            achievements: Array.isArray(achievements) ? achievements : [],
          },
          create: {
            user_id: userId,
            major: String(major),
            graduation_year: gradYearInt,
            classification: classificationKey,
            available_for_project: Boolean(availableForProject),
            summary: typeof summary === "string" ? summary : null,
            image_url: typeof imageUrl === "string" ? imageUrl : null,
            skills: Array.isArray(skills) ? skills : [],
            projects: Array.isArray(projects) ? projects : [],
            achievements: Array.isArray(achievements) ? achievements : [],
          },
          select: { id: true, kudo_count: true, view_count: true },
        });

        return Response.json(
          {
            studentId: student.id,
            metrics: {
              kudos: student.kudo_count,
              views: student.view_count,
            },
          },
          { status: 201 },
        );
      } catch (fallbackError) {
        console.error("[/api/onboard][POST] Fallback upsert failed:", fallbackError);
        const message =
          process.env.NODE_ENV === "development" && fallbackError instanceof Error
            ? fallbackError.message
            : "Internal server error.";
        return Response.json({ error: message }, { status: 500 });
      }
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    console.error("[/api/onboard] Unexpected error:", error);
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Internal server error.";
    return Response.json({ error: message }, { status: 500 });
  }
}
