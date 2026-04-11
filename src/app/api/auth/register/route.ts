import { randomBytes, scryptSync } from "node:crypto";
import { getPrismaClient } from "@/lib/prisma";

const CLASSIFICATIONS = ["FRESHMAN", "SOPHOMORE", "JUNIOR", "SENIOR"] as const;

type Classification = (typeof CLASSIFICATIONS)[number];

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  major: string;
  graduationYear: number;
  classification: Classification;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function validate(body: unknown): { ok: true; data: RegisterPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid payload." };
  }

  const data = body as Partial<RegisterPayload>;

  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const password = data.password;
  const major = data.major?.trim();
  const graduationYear = data.graduationYear;
  const classification = data.classification;

  if (!name || !email || !password || !major) {
    return { ok: false, error: "All fields are required." };
  }

  if (!email.includes("@")) {
    return { ok: false, error: "Please enter a valid email." };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  if (
    typeof graduationYear !== "number" ||
    !Number.isInteger(graduationYear) ||
    graduationYear < 2000 ||
    graduationYear > 2100
  ) {
    return { ok: false, error: "Graduation year must be between 2000 and 2100." };
  }

  if (!classification || !CLASSIFICATIONS.includes(classification)) {
    return { ok: false, error: "Please choose a valid classification." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
      major,
      graduationYear,
      classification,
    },
  };
}

function isKnownPrismaErrorWithCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { code: string }).code === code
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validate(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { name, email, password, major, graduationYear, classification } = validation.data;
  const prisma = getPrismaClient();

  try {
    const created = await prisma.users.create({
      data: {
        name,
        email,
        password: hashPassword(password),
        student: {
          create: {
            major,
            graduation_year: graduationYear,
            classification,
          },
        },
      },
      select: {
        id: true,
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    return Response.json(
      {
        userId: created.id,
        studentId: created.student?.id ?? null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isKnownPrismaErrorWithCode(error, "P2002")) {
      return Response.json({ error: "Email is already registered." }, { status: 409 });
    }

    return Response.json({ error: "Failed to create account." }, { status: 500 });
  }
}
