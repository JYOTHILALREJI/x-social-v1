import { PrismaClient } from '../src/generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email: 'testcreator@example.com' },
      data: { 
        role: 'CREATOR',
        creatorStatus: 'APPROVED' 
      },
    });
    
    // Also create CreatorProfile if it doesn't exist
    const profile = await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      update: { status: 'APPROVED' },
      create: {
        userId: user.id,
        idProofUrl: 'test-url',
        selfieUrl: 'test-url',
        status: 'APPROVED',
        tier1Price: 500,
        tier2Price: 1000,
        tier3Price: 2000,
        categories: []
      }
    });

    console.log('User approved perfectly:', user.username);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
