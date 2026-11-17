import { PrismaClient } from "./generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const adapter = new PrismaNeon(
    { connectionString: process.env.DATABASE_URL },
    {
      onPoolError: (err) => console.error("[PrismaNeon] Pool error:", err),
      onConnectionError: (err) => console.error("[PrismaNeon] Connection error:", err),
    }
  );
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
