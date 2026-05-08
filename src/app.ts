import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma.js";

const app = express();

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Funch Car Rental API is online",
    endpoints: ["/health", "/cars", "/users"],
  });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "connected",
      message: "Car Rental API is running",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: "Car Rental API is running but database is unavailable",
    });
  }
});

app.get("/cars", async (_req, res) => {
  try {
    const cars = await prisma.car.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        brand: true,
        model: true,
        year: true,
        category: true,
        city: true,
        countryCode: true,
        currencyCode: true,
        hourlyRate: true,
        dailyRate: true,
        seats: true,
        transmission: true,
        fuelType: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      data: cars,
      count: cars.length,
    });
  } catch (error) {
    console.error("Failed to fetch cars:", error);

    res.status(500).json({
      message: "Failed to fetch cars",
    });
  }
});

app.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        countryCode: true,
        timezone: true,
        currencyCode: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    res.json({
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

export default app;
