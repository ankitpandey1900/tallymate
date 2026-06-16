import { PrismaClient } from "@prisma/client";

declare global {
   
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!globalThis.prisma) {
  globalThis.prisma = prisma;
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️ Warning: DATABASE_URL is not set. Database queries will fail. " +
    "Please configure a PostgreSQL connection string in your .env file."
  );
}
