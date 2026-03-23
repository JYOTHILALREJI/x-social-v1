UPDATE "User" SET "role" = 'CREATOR', "creatorStatus" = 'APPROVED' WHERE "email" = 'testcreator@example.com';
INSERT INTO "CreatorProfile" ("id", "userId", "idProofUrl", "selfieUrl", "status", "subscriptionPrice", "createdAt") 
VALUES ('test-profile-id', (SELECT "id" FROM "User" WHERE "email" = 'testcreator@example.com'), 'test-url', 'test-url', 'APPROVED', 15, NOW())
ON CONFLICT ("userId") DO UPDATE SET "status" = 'APPROVED', "subscriptionPrice" = 15;
