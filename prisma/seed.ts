import { randomBytes, scryptSync } from "node:crypto";
import { randomUUID } from "node:crypto";
import { PrismaClient, Classification } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { students } from "../src/data/students";
import { PREDEFINED_MAJORS, normalizeMajorName, isPredefinedMajor } from "../src/lib/majors";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before running prisma seed.");
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function mapClassification(year: string): Classification {
  switch (year) {
    case "freshman":
      return Classification.FRESHMAN;
    case "sophomore":
      return Classification.SOPHOMORE;
    case "junior":
      return Classification.JUNIOR;
    case "senior":
      return Classification.SENIOR;
    default:
      throw new Error(`Unsupported academic year: ${year}`);
  }
}

async function seed() {
  const defaultPassword = process.env.SEED_USER_PASSWORD ?? "ChangeMe123!";

  for (const majorName of PREDEFINED_MAJORS) {
    await prisma.major.upsert({
      where: { name: majorName },
      update: {
        is_active: true,
      },
      create: {
        id: randomUUID(),
        name: majorName,
        is_active: true,
      },
      select: {
        id: true,
      },
    });
  }

  const majors = await prisma.major.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const majorIdByName = new Map(majors.map((major) => [major.name, major.id]));

  for (const student of students) {
    const email = `${student.id}@seed.local`;

    const user = await prisma.users.upsert({
      where: { email },
      update: {
        name: student.name,
      },
      create: {
        name: student.name,
        email,
        password: hashPassword(defaultPassword),
      },
      select: {
        id: true,
      },
    });

    const normalizedMajor = normalizeMajorName(student.major);
    const canonicalMajor = isPredefinedMajor(normalizedMajor)
      ? normalizedMajor
      : "Bachelor of Science in Software Development";
    const majorId = majorIdByName.get(canonicalMajor);

    if (!majorId) {
      throw new Error(`Missing seeded major ID for: ${canonicalMajor}`);
    }

    await prisma.student.upsert({
      where: {
        user_id: user.id,
      },
      update: {
        major_id: majorId,
        graduation_year: new Date().getFullYear() + (student.year === "freshman" ? 4 : student.year === "sophomore" ? 3 : student.year === "junior" ? 2 : 1),
        classification: mapClassification(student.year),
        available_for_project: student.available,
        summary: student.summary,
        image_url: student.imageUrl,
        skills: student.skills,
        projects: student.projects,
        achievements: student.achievements,
      },
      create: {
        id: randomUUID(),
        user_id: user.id,
        major_id: majorId,
        graduation_year: new Date().getFullYear() + (student.year === "freshman" ? 4 : student.year === "sophomore" ? 3 : student.year === "junior" ? 2 : 1),
        classification: mapClassification(student.year),
        available_for_project: student.available,
        summary: student.summary,
        image_url: student.imageUrl,
        skills: student.skills,
        projects: student.projects,
        achievements: student.achievements,
      },
    });
  }

  console.log(`Seeded ${students.length} students.`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });