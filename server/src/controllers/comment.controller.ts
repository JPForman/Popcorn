import type { Request, Response } from "express";
import type { CommentParams, CreateCommentInput, RatingIdParams } from "@popcorn/shared";
import { UnauthorizedError } from "../lib/errors.js";
import { createComment, deleteComment, getComments } from "../services/comment.service.js";

export async function postComment(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { ratingId } = req.params as unknown as RatingIdParams;
  const comment = await createComment(ratingId, req.user.id, req.body as CreateCommentInput);
  res.status(201).json(comment);
}

export async function listComments(req: Request, res: Response) {
  const { ratingId } = req.params as unknown as RatingIdParams;
  res.json(await getComments(ratingId));
}

export async function removeComment(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { id } = req.params as unknown as CommentParams;
  await deleteComment(id, req.user.id);
  res.status(204).send();
}
