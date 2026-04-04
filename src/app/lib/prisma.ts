import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  const adapter = new PrismaPg(pool as any);
  
  return new PrismaClient({ 
    adapter,
    // Add datasource for Prisma 7 if needed, but usually config handles it.
  });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;