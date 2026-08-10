import type { Request, Response } from "express";
import type { UserIdParams } from "@popcorn/shared";
import { UnauthorizedError } from "../lib/errors.js";
import { followUser, getFollowers, getFollowing, unfollowUser } from "../services/follow.service.js";

export async function follow(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { userId } = req.params as unknown as UserIdParams;
  await followUser(req.user.id, userId);
  res.status(204).send();
}

export async function unfollow(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { userId } = req.params as unknown as UserIdParams;
  await unfollowUser(req.user.id, userId);
  res.status(204).send();
}

export async function listFollowers(req: Request, res: Response) {
  const { userId } = req.params as unknown as UserIdParams;
  res.json(await getFollowers(userId));
}

export async function listFollowing(req: Request, res: Response) {
  const { userId } = req.params as unknown as UserIdParams;
  res.json(await getFollowing(userId));
}
