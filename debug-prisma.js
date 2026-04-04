const { prisma } = require("./src/app/lib/prisma");

async function main() {
  try {
    const reel = await prisma.reel.findFirst({
      include: {
        likes: true,
        comments: true,
        upvotes: true,
      }
    });
    console.log("Success! Reel found with relations.");
  } catch (error) {
    console.error("Prisma Error:", error.message);
  } finally {
    process.exit(0);
  }
}

main();
