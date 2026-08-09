import type { Request, Response } from "express";
import { updateProfileSchema } from "@popcorn/shared";
import { getUserById, updateUser } from "../services/user.service.js";
import { NotFoundError, UnauthorizedError } from "../lib/errors.js";

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  res.json(req.user);
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const input = updateProfileSchema.parse(req.body);
  const updated = await updateUser(req.user.id, input);
  res.json(updated);
}

export async function getPublicUser(req: Request, res: Response) {
  const user = await getUserById(req.params.userId);
  if (!user) throw new NotFoundError("User not found");
  res.json(user);
}
