import type { Request, Response } from "express";
import type { TitleParams } from "@popcorn/shared";
import { getOrFetchTitle } from "../services/title.service.js";

export async function getTitleDetail(req: Request, res: Response) {
  const { tmdbId, type } = req.params as unknown as TitleParams;
  const title = await getOrFetchTitle(tmdbId, type, req.user?.id);
  res.json(title);
}
