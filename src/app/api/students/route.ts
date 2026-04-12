import { Classification } from "@prisma/client";
import type { AcademicYear, SocialLinks, Student, TimelineItem } from "@/types/student";
import { getPrismaClient } from "@/lib/prisma";

function parseVerifiedBy(value: unknown): TimelineItem["verifiedBy"] {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const name = typeof candidate.name === "string" ? candidate.name : "";

  if (!name) {
    return undefined;
  }

  return {
    name,
    role: typeof candidate.role === "string" ? candidate.role : undefined,
    title: typeof candidate.title === "string" ? candidate.title : undefined,
    occupation: typeof candidate.occupation === "string" ? candidate.occupation : undefined,
    userId: typeof candidate.userId === "string" ? candidate.userId : undefined,
  };
}

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
    const archivedAt = typeof candidate.archivedAt === "string" ? candidate.archivedAt : undefined;

    if (archivedAt) {
      continue;
    }

    if (!period || !title) {
      continue;
    }

    const timelineItem: TimelineItem = { period, title };
    if (typeof candidate.details === "string") {
      timelineItem.details = candidate.details;
    }

    const verifiedBy = parseVerifiedBy(candidate.verifiedBy);
    if (verifiedBy) {
      timelineItem.verifiedBy = verifiedBy;
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
    const students = (await prisma.student.findMany({
      include: {
        major: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    })) as Array<{
      id: string;
      classification: Classification;
      view_count: number;
      kudo_count: number;
      skills: unknown;
      available_for_project: boolean;
      projects: unknown;
      achievements: unknown;
      summary: string | null;
      image_url: string | null;
      social_links: unknown;
      user: {
        name: string;
      };
      major: {
        name: string;
      } | null;
    }>;

    const payload: Student[] = students.map((student) => ({
      id: student.id,
      name: student.user.name,
      year: toAcademicYear(student.classification),
      major: student.major?.name ?? "Undeclared",
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