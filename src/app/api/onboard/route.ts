import { getPrismaClient } from "@/lib/prisma";
import { Classification } from "@prisma/client";


export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { userId, major, graduationYear, year, summary, imageUrl, skills, projects, achievements } = body as Record<string, unknown>;

  if (!userId || !major || !graduationYear || !year) {
    return Response.json({ error: "userId, major, graduationYear, and year are required." }, { status: 400 });
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
    const student = await prisma.student.create({
      data: {
        user_id: Number(userId),
        major: String(major),
        graduation_year: gradYearInt,
        classification: classificationKey,
        summary: typeof summary === "string" ? summary : null,
        image_url: typeof imageUrl === "string" ? imageUrl : null,
        skills: Array.isArray(skills) ? skills : [],
        projects: Array.isArray(projects) ? projects : [],
        achievements: Array.isArray(achievements) ? achievements : [],
      },
      select: { id: true },
    });

    return Response.json({ studentId: student.id }, { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return Response.json({ error: "Student profile already exists for this account." }, { status: 409 });
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
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
