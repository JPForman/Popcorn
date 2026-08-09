import type { NextFunction, Request, Response } from "express";
import { firebaseAuth } from "../lib/firebaseAdmin.js";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../lib/errors.js";

async function verifyToken(req: Request): Promise<string | undefined> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;

  const idToken = header.slice("Bearer ".length);
  const decoded = await firebaseAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const uid = await verifyToken(req);
    if (!uid) throw new UnauthorizedError("Missing or invalid Authorization header");

    req.firebaseUid = uid;
    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
    if (!user) {
      throw new UnauthorizedError("No local account for this Firebase user — call /api/auth/bootstrap first");
    }
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError());
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const uid = await verifyToken(req);
    if (uid) {
      req.firebaseUid = uid;
      req.user = (await prisma.user.findUnique({ where: { firebaseUid: uid } })) ?? undefined;
    }
    next();
  } catch {
    next();
  }
}
