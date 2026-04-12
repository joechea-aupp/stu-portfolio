import { getPrismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    const prisma = getPrismaClient();
    const majors = await prisma.major.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
      },
    });

    return Response.json({
      majors: majors.map((entry) => entry.name),
    });
  } catch (error) {
    console.error("[/api/majors] Unexpected error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}