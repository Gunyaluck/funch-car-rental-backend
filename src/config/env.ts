import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  FRONTEND_URLS: z.string().optional(),
  ALLOW_VERCEL_PREVIEW_ORIGINS: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
});

const parsedEnv = envSchema.parse(process.env);
const normalizeOrigin = (url: string) => url.trim().replace(/\/+$/, "");
const frontendUrls = parsedEnv.FRONTEND_URLS
  ? parsedEnv.FRONTEND_URLS.split(",")
      .map(normalizeOrigin)
      .filter(Boolean)
  : [normalizeOrigin(parsedEnv.FRONTEND_URL)];

export const env = {
  ...parsedEnv,
  FRONTEND_URL: normalizeOrigin(parsedEnv.FRONTEND_URL),
  FRONTEND_URLS: frontendUrls,
  JWT_ACCESS_SECRET: parsedEnv.JWT_ACCESS_SECRET ?? parsedEnv.JWT_SECRET,
  JWT_REFRESH_SECRET: parsedEnv.JWT_REFRESH_SECRET ?? parsedEnv.JWT_SECRET,
};
