import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().min(1).optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  JWT_ACCESS_SECRET: parsedEnv.JWT_ACCESS_SECRET ?? parsedEnv.JWT_SECRET,
};
