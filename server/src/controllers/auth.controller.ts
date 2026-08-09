import type { Request, Response } from "express";
import { firebaseAuth } from "../lib/firebaseAdmin.js";
import { bootstrapUser } from "../services/user.service.js";
import { UnauthorizedError } from "../lib/errors.js";

export async function bootstrap(req: Request, res: Response) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new UnauthorizedError("Missing Authorization header");

  const idToken = header.slice("Bearer ".length);
  const decoded = await firebaseAuth.verifyIdToken(idToken);

  const email = decoded.email;
  if (!email) throw new UnauthorizedError("Firebase account has no email");

  const displayName = decoded.name ?? email.split("@")[0];
  const user = await bootstrapUser(decoded.uid, email, displayName);
  res.status(200).json(user);
}
