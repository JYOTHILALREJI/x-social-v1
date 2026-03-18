import { prisma } from "../src/app/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("--- 🚀 Starting Seeding Process ---");

  // 1. Cleanup existing data (be careful in production!)
  await prisma.match.deleteMany();

  await prisma.post.deleteMany();
  await prisma.reel.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 2. Create Interests for the Dating Algorithm
  const interests = await Promise.all([
    prisma.interest.create({ data: { name: "Photography" } }),
    prisma.interest.create({ data: { name: "Fitness" } }),
    prisma.interest.create({ data: { name: "Travel" } }),
    prisma.interest.create({ data: { name: "Gaming" } }),
    prisma.interest.create({ data: { name: "Art" } }),
  ]);

  // 3. Create a Luxury Creator
  const creator = await prisma.user.create({
    data: {
      email: "creator@xsocial.com",
      username: "scarlett_rose",
      password: hashedPassword,
      dob: new Date("1998-05-15"),
      role: "CREATOR",
      creatorStatus: "APPROVED",
      walletBalance: 50000, // $500.00
      bio: "Creating exclusive content for my top fans 💋 | Digital Artist",
      gender: "Female",
      interestedIn: "Male",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330", 
      posts: {
        create: [
          {
            imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f",
            caption: "Golden hour in the city ☀️",
            isPremium: false,
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1529139513065-07b3b1bfde91",
            caption: "Exclusive midnight set for subscribers only.",
            isPremium: true,
            price: 1000, 
          },
        ],
      },
      reels: {
        create: [
          {
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-12859-large.mp4",
            caption: "Neon vibes tonight ✨",
          },
        ],
      },
    },
  });

  // 4. Create a Standard User (The Fan)
  const fan = await prisma.user.create({
    data: {
      email: "fan@xsocial.com",
      username: "john_doe",
      password: hashedPassword,
      dob: new Date("1995-10-20"),
      role: "USER",
      walletBalance: 2500, // $25.00
      bio: "Tech enthusiast and traveler.",
      gender: "Male",
      interestedIn: "Female",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
  });

  // 5. Create a Match (Dating Logic)
  await prisma.match.create({
    data: {
      senderId: fan.id,
      receiverId: creator.id,
      status: "ACCEPTED",
    },
  });

  // 6. Link Interests
  await prisma.userInterest.createMany({
    data: [
      { userId: creator.id, interestId: interests[0].id },
      { userId: creator.id, interestId: interests[4].id },
      { userId: fan.id, interestId: interests[2].id },
    ],
  });

  console.log("--- ✅ Seeding Finished Successfully ---");
  console.log(`Created Creator: ${creator.username}`);
  console.log(`Created Fan: ${fan.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });