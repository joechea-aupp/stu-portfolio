import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/prisma";
import { Classification } from "@prisma/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-session";

function parseSessionUserId(rawCookie: string | undefined): number | null {
  if (!rawCookie) {
    return null;
  }

  const session = verifySessionToken(rawCookie);
  return session?.userId ?? null;
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
    },
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

  const { major, graduationYear, year, summary, imageUrl, skills, projects, achievements, availableForProject } = normalizeDraftBody(body as Record<string, unknown>);

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

  try {
    const student = await prisma.student.upsert({
      where: {
        user_id: userId,
      },
      data: {
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
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return Response.json({ error: "User not found." }, { status: 404 });
    }
    console.error("[/api/onboard] Unexpected error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
