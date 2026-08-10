import type { CreateCommentInput } from "@popcorn/shared";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";

const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

async function requireRating(ratingId: string) {
  const rating = await prisma.rating.findUnique({ where: { id: ratingId } });
  if (!rating) throw new NotFoundError("Rating not found");
  return rating;
}

export async function createComment(ratingId: string, userId: string, input: CreateCommentInput) {
  await requireRating(ratingId);
  return prisma.comment.create({
    data: { ratingId, userId, body: input.body },
    include: { user: { select: AUTHOR_SELECT } },
  });
}

export async function getComments(ratingId: string) {
  await requireRating(ratingId);
  return prisma.comment.findMany({
    where: { ratingId },
    include: { user: { select: AUTHOR_SELECT } },
    orderBy: { createdAt: "asc" },
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new NotFoundError("Comment not found");
  if (comment.userId !== userId) throw new ForbiddenError("You can only delete your own comments");
  await prisma.comment.delete({ where: { id: commentId } });
}
