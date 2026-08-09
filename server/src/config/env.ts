import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  TMDB_API_KEY: z.string().min(1),
  TMDB_API_BASE_URL: z.string().default("https://api.themoviedb.org/3"),
  TMDB_IMAGE_BASE_URL: z.string().default("https://image.tmdb.org/t/p/"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
