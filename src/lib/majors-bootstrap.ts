import { getPrismaClient } from "@/lib/prisma";
import { PREDEFINED_MAJORS, normalizeMajorName } from "@/lib/majors";

let didBootstrap = false;
let bootstrapPromise: Promise<void> | null = null;

async function runBootstrap() {
  const prisma = getPrismaClient();

  const majorTableRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'majors'
  `;

  if ((majorTableRows[0]?.total ?? 0) === 0) {
    return;
  }

  for (const majorName of PREDEFINED_MAJORS) {
    await prisma.major.upsert({
      where: {
        name: majorName,
      },
      update: {
        is_active: true,
      },
      create: {
        name: majorName,
        is_active: true,
      },
      select: {
        id: true,
      },
    });
  }

  const majorColumnRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'students'
      AND column_name = 'major'
  `;

  if ((majorColumnRows[0]?.total ?? 0) === 0) {
    didBootstrap = true;
    return;
  }

  const studentsNeedingBackfill = await prisma.$queryRaw<Array<{ student_id: string; legacy_major: string | null }>>`
    SELECT id AS student_id, major AS legacy_major
    FROM students
    WHERE major_id IS NULL
      AND major IS NOT NULL
      AND CHAR_LENGTH(TRIM(major)) > 0
  `;

  if (studentsNeedingBackfill.length === 0) {
    didBootstrap = true;
    return;
  }

  const majors = await prisma.major.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const majorIdByName = new Map(majors.map((row) => [row.name, row.id]));

  for (const row of studentsNeedingBackfill) {
    if (!row.legacy_major) {
      continue;
    }

    const normalized = normalizeMajorName(row.legacy_major);
    const majorId = majorIdByName.get(normalized);

    if (!majorId) {
      continue;
    }

    await prisma.$executeRaw`
      UPDATE students
      SET major_id = ${majorId}
      WHERE id = ${row.student_id}
        AND major_id IS NULL
    `;
  }

  didBootstrap = true;
}

export async function ensureMajorsBootstrap() {
  if (didBootstrap) {
    return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
}
