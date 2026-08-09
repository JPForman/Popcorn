import { Router } from "express";
import { bootstrap } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/bootstrap", bootstrap);
