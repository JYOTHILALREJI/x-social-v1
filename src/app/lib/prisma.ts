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
  });
};

// Force fresh instance once to resolve "findMany" undefined error
export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") (global as any).prisma = prisma;