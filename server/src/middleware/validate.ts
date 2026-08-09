import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}
