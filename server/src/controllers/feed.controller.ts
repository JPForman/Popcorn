import type { Request, Response } from "express";
import type { FeedQuery } from "@popcorn/shared";
import { UnauthorizedError } from "../lib/errors.js";
import { getFeed } from "../services/feed.service.js";

export async function feed(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await getFeed(req.user.id, req.query as unknown as FeedQuery);
  res.json(result);
}
