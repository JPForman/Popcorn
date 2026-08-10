import type { Request, Response } from "express";
import type { CreateRatingInput, RatingParams, UpdateRatingInput } from "@popcorn/shared";
import { UnauthorizedError } from "../lib/errors.js";
import { deleteRating, updateRating, upsertRating } from "../services/rating.service.js";

export async function createRating(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const rating = await upsertRating(req.user.id, req.body as CreateRatingInput);
  res.status(201).json(rating);
}

export async function patchRating(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { id } = req.params as unknown as RatingParams;
  const rating = await updateRating(id, req.user.id, req.body as UpdateRatingInput);
  res.json(rating);
}

export async function removeRating(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { id } = req.params as unknown as RatingParams;
  await deleteRating(id, req.user.id);
  res.status(204).send();
}
