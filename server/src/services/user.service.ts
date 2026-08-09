import { prisma } from "../lib/prisma.js";
import type { UpdateProfileInput } from "@popcorn/shared";

export async function bootstrapUser(firebaseUid: string, email: string, displayName: string) {
  return prisma.user.upsert({
    where: { firebaseUid },
    update: {},
    create: {
      firebaseUid,
      email,
      displayName,
    },
  });
}

export function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function updateUser(id: string, input: UpdateProfileInput) {
  return prisma.user.update({ where: { id }, data: input });
}
