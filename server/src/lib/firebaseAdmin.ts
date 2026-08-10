import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: Buffer.from(env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString("utf8"),
    }),
  });

export const firebaseAuth = getAuth(app);
