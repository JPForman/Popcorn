import type { Request, Response } from "express";
import type { TimelineQuery, UserSearchQuery } from "@popcorn/shared";
import { updateProfileSchema } from "@popcorn/shared";
import { getUserById, searchUsers, updateUser } from "../services/user.service.js";
import { getUserRatings } from "../services/rating.service.js";
import { getFollowCounts, isFollowing } from "../services/follow.service.js";
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

export async function search(req: Request, res: Response) {
  const { q } = req.query as unknown as UserSearchQuery;
  res.json(await searchUsers(q, req.user?.id));
}

export async function getPublicUser(req: Request, res: Response) {
  const user = await getUserById(req.params.userId);
  if (!user) throw new NotFoundError("User not found");

  const [counts, viewerIsFollowing] = await Promise.all([
    getFollowCounts(user.id),
    req.user ? isFollowing(req.user.id, user.id) : Promise.resolve(false),
  ]);

  res.json({ ...user, ...counts, viewerIsFollowing });
}

export async function getUserTimeline(req: Request, res: Response) {
  const user = await getUserById(req.params.userId);
  if (!user) throw new NotFoundError("User not found");

  const timeline = await getUserRatings(user.id, req.query as unknown as TimelineQuery);
  res.json(timeline);
}
