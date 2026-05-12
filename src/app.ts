import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
