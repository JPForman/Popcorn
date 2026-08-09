import { Router } from "express";
import { searchQuerySchema } from "@popcorn/shared";
import { validate } from "../middleware/validate.js";
import { optionalAuth } from "../middleware/auth.js";
import { search } from "../controllers/search.controller.js";

export const searchRouter = Router();

searchRouter.get("/", optionalAuth, validate(searchQuerySchema, "query"), search);
