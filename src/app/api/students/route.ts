import { Classification } from "@prisma/client";
import type { AcademicYear, SocialLinks, Student, TimelineItem } from "@/types/student";
import { getPrismaClient } from "@/lib/prisma";

function toAcademicYear(classification: Classification): AcademicYear {
  return classification.toLowerCase() as AcademicYear;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function asTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: TimelineItem[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Record<string, unknown>;
    const period = typeof candidate.period === "string" ? candidate.period : "";
    const title = typeof candidate.title === "string" ? candidate.title : "";

    if (!period || !title) {
      continue;
    }

    const timelineItem: TimelineItem = { period, title };
    if (typeof candidate.details === "string") {
      timelineItem.details = candidate.details;
    }

    const verifiedByValue = candidate.verifiedBy;
    if (verifiedByValue && typeof verifiedByValue === "object") {
      const name =
        typeof (verifiedByValue as Record<string, unknown>).name === "string"
          ? ((verifiedByValue as Record<string, unknown>).name as string)
          : "";
      const role =
        typeof (verifiedByValue as Record<string, unknown>).role === "string"
          ? ((verifiedByValue as Record<string, unknown>).role as string)
          : "";

      if (name && role) {
        timelineItem.verifiedBy = { name, role };
      }
    }

    items.push(timelineItem);
  }

  return items;
}

function asSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object") {
    return {};
  }

  const candidate = value as Record<string, unknown>;

  return {
    linkedin: typeof candidate.linkedin === "string" ? candidate.linkedin : undefined,
    facebook: typeof candidate.facebook === "string" ? candidate.facebook : undefined,
    github: typeof candidate.github === "string" ? candidate.github : undefined,
    instagram: typeof candidate.instagram === "string" ? candidate.instagram : undefined,
  };
}

export async function GET() {
  try {
    const prisma = getPrismaClient();
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const payload: Student[] = students.map((student) => ({
      id: String(student.id),
      name: student.user.name,
      year: toAcademicYear(student.classification),
      major: student.major,
      viewCount: student.view_count,
      kudoCount: student.kudo_count,
      skills: asStringArray(student.skills),
      available: student.available_for_project,
      projects: asTimelineItems(student.projects),
      achievements: asTimelineItems(student.achievements),
      summary: student.summary ?? "",
      imageUrl:
        student.image_url && student.image_url.trim().length > 0
          ? student.image_url
          : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=640&q=80",
      socialLinks: asSocialLinks(student.social_links),
    }));

    return Response.json({ students: payload });
  } catch (error) {
    console.error("[/api/students] Unexpected error:", error);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}