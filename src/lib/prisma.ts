import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma client.");
  }

  const adapter = new PrismaMariaDb(databaseUrl);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export function getPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }

  return global.prisma;
}
