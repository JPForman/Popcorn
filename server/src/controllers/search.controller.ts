import type { Request, Response } from "express";
import type { SearchQuery } from "@popcorn/shared";
import { searchTitles } from "../services/title.service.js";

export async function search(req: Request, res: Response) {
  const { q, type } = req.query as unknown as SearchQuery;
  const results = await searchTitles(q);
  res.json(type ? results.filter((r) => r.type === type) : results);
}
