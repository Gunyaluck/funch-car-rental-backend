import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  FRONTEND_URLS: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
});

const parsedEnv = envSchema.parse(process.env);
const frontendUrls = parsedEnv.FRONTEND_URLS
  ? parsedEnv.FRONTEND_URLS.split(",")
      .map((url) => url.trim())
      .filter(Boolean)
  : [parsedEnv.FRONTEND_URL];

export const env = {
  ...parsedEnv,
  FRONTEND_URLS: frontendUrls,
  JWT_ACCESS_SECRET: parsedEnv.JWT_ACCESS_SECRET ?? parsedEnv.JWT_SECRET,
};
