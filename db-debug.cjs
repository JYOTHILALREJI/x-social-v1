
const { PrismaClient } = require("./src/generated/prisma/client");
const prisma = new PrismaClient();

async function main() {
  const postsCount = await prisma.post.count();
  const followsCount = await prisma.follow.count();
  const usersCount = await prisma.user.count();
  console.log({ postsCount, followsCount, usersCount });
  const posts = await prisma.post.findMany({ take: 5, select: { id: true, isPremium: true, author: { select: { username: true } } } });
  console.log("Recent posts:", posts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
