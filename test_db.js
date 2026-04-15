import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
const result = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 1 });
console.log(result);
await prisma.$disconnect();
