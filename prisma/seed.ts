import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Fixed, documented credentials — published in README for reviewers.
const USERS = [
  { name: "Alice Chen", email: "alice@kalam.dev", password: "password123" },
  { name: "Bob Martinez", email: "bob@kalam.dev", password: "password123" },
  { name: "Carol Singh", email: "carol@kalam.dev", password: "password123" },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const [alice, bob, carol] = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { name: u.name, email: u.email, passwordHash },
      }),
    ),
  );

  const doc1 = await prisma.document.create({
    data: {
      title: "Q3 Product Roadmap",
      ownerId: alice.id,
      content:
        "<h1>Q3 Product Roadmap</h1><p>Draft priorities for next quarter.</p><ul><li>Ship collaborative editing</li><li>Improve onboarding</li></ul>",
    },
  });

  await prisma.document.create({
    data: {
      title: "Untitled document",
      ownerId: alice.id,
      content: "<p></p>",
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: "Team Meeting Notes",
      ownerId: bob.id,
      content:
        "<h2>Team Meeting Notes</h2><p>Attendees: Bob, Carol.</p><p><strong>Action items:</strong></p><ol><li>Follow up with design</li><li>Ship v1</li></ol>",
    },
  });

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: doc1.id, userId: bob.id } },
    update: {},
    create: {
      documentId: doc1.id,
      userId: bob.id,
      role: "EDITOR",
      grantedById: alice.id,
    },
  });

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: doc3.id, userId: carol.id } },
    update: {},
    create: {
      documentId: doc3.id,
      userId: carol.id,
      role: "VIEWER",
      grantedById: bob.id,
    },
  });

  console.log("Seeded users:", alice.email, bob.email, carol.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
