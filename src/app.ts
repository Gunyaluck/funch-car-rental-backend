import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

const app = express();
const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, "");

const isAllowedVercelPreviewOrigin = (origin: string) => {
  if (!env.ALLOW_VERCEL_PREVIEW_ORIGINS) {
    return false;
  }

  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (
        env.FRONTEND_URLS.includes(normalizedOrigin) ||
        isAllowedVercelPreviewOrigin(normalizedOrigin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${normalizedOrigin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
