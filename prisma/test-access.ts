import { prisma } from "../src/app/lib/prisma";

async function testAccess() {
  console.log("--- 🧪 Testing Premium Access Logic ---");

  // 1. Get Creator and Fan from DB
  const creator = await prisma.user.findUnique({ where: { email: "creator@xsocial.com" }, include: { posts: true } });
  const fan = await prisma.user.findUnique({ where: { email: "fan@xsocial.com" } });

  if (!creator || !fan) {
    console.error("❌ Creator or Fan not found. Please run seed first.");
    return;
  }

  const premiumPost = creator.posts.find(p => p.isPremium);
  if (!premiumPost) {
    console.error("❌ Premium post not found.");
    return;
  }

  console.log(`Testing Post ID: ${premiumPost.id} (Premium: ${premiumPost.isPremium}, Author: ${premiumPost.authorId})`);

  // Helper simulated from API route
  async function checkAccess(userId: string | null, postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { isPremium: true, authorId: true }
    });
    if (!post) return false;
    if (!post.isPremium) return true;
    if (!userId) return false;
    if (userId === post.authorId) return true;

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: post.authorId } }
    });
    if ((follow?.subscriptionTier || 0) > 0) return true;

    const purchase = await prisma.purchase.findUnique({
      where: { userId_postId: { userId, postId } }
    });
    return !!purchase;
  }

  // TEST 1: Creator access
  const creatorAccess = await checkAccess(creator.id, premiumPost.id);
  console.log(`✅ Creator Access: ${creatorAccess} (Expected: true)`);

  // TEST 2: Fan access (initial)
  const fanAccessInitial = await checkAccess(fan.id, premiumPost.id);
  console.log(`✅ Fan Initial Access: ${fanAccessInitial} (Expected: false)`);

  // TEST 3: Fan access after following (not subscribed)
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: fan.id, followingId: creator.id } },
    update: { subscriptionTier: 0 },
    create: { followerId: fan.id, followingId: creator.id, subscriptionTier: 0 }
  });
  const fanAccessFollowed = await checkAccess(fan.id, premiumPost.id);
  console.log(`✅ Fan Followed (Not Subscribed) Access: ${fanAccessFollowed} (Expected: false)`);

  // TEST 4: Fan access after subscribing
  await prisma.follow.update({
    where: { followerId_followingId: { followerId: fan.id, followingId: creator.id } },
    data: { subscriptionTier: 1 }
  });
  const fanAccessSubscribed = await checkAccess(fan.id, premiumPost.id);
  console.log(`✅ Fan Subscribed Access: ${fanAccessSubscribed} (Expected: true)`);

  // Reset subscription
  await prisma.follow.update({
    where: { followerId_followingId: { followerId: fan.id, followingId: creator.id } },
    data: { subscriptionTier: 0 }
  });

  // TEST 5: Fan access after purchase
  await prisma.purchase.create({
    data: { userId: fan.id, postId: premiumPost.id }
  });
  const fanAccessPurchased = await checkAccess(fan.id, premiumPost.id);
  console.log(`✅ Fan Purchased Access: ${fanAccessPurchased} (Expected: true)`);

  // CLEANUP
  await prisma.purchase.deleteMany({ where: { userId: fan.id, postId: premiumPost.id } });
  
  console.log("--- 🏁 Test Finished ---");
}

testAccess()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
