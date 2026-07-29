import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "DocumentShare","Document","User" RESTART IDENTITY CASCADE',
  );
}

export async function createTestUser(email: string, name: string) {
  const passwordHash = await hashPassword("password123");
  return prisma.user.create({ data: { email, name, passwordHash } });
}
