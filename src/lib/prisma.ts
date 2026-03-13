import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// We define a function to create the adapter-based client
const createPrismaClient = () => {
  // Prisma 7 requires the adapter. We pass the connection string 
  // directly into the PrismaPg config object.
  const adapter = new PrismaPg({ 
    connectionString: process.env.DATABASE_URL 
  })
  
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma