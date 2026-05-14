import {
  BookingStatus,
  CarCategory,
  CarStatus,
  PricingMode,
} from "@prisma/client";
import type { Car } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";

const regularLocationHours = [
  { dayOfWeek: 1, openTime: "08:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "18:00", isClosed: false },
  { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: false },
];

const cars = [
  {
    key: "tokyo-yaris-at",
    name: "Toyota Yaris Urban AT",
    brand: "Toyota",
    model: "Yaris",
    year: 2024,
    category: CarCategory.SEDAN,
    countryCode: "JP",
    city: "Tokyo",
    timezone: "Asia/Tokyo",
    currencyCode: "JPY",
    hourlyRate: "900",
    dailyRate: "5200",
    seats: 5,
    transmission: "AUTOMATIC",
    fuelType: "Petrol",
    description: "Best for compact city travel and station pickup.",
    status: CarStatus.AVAILABLE,
    minAdvanceBookingHr: 2,
    maxBookingDays: 30,
    bufferHours: 2,
    images: [
      "https://images.example.com/cars/yaris-cover.jpg",
      "https://images.example.com/cars/yaris-cabin.jpg",
    ],
    options: [
      {
        name: "Child Seat",
        pricePerDay: "200",
        description: "Suitable for toddlers.",
      },
      {
        name: "GPS",
        pricePerDay: "150",
        description: "Portable navigation device.",
      },
    ],
    blockedBooking: {
      pickupAt: new Date("2026-05-16T00:00:00.000Z"),
      returnAt: new Date("2026-05-18T18:00:00.000Z"),
    },
  },
  {
    key: "osaka-serena-family",
    name: "Nissan Serena Family Van",
    brand: "Nissan",
    model: "Serena",
    year: 2023,
    category: CarCategory.VAN,
    countryCode: "JP",
    city: "Osaka",
    timezone: "Asia/Tokyo",
    currencyCode: "JPY",
    hourlyRate: "1200",
    dailyRate: "7500",
    seats: 7,
    transmission: "AUTOMATIC",
    fuelType: "Hybrid",
    description: "Large cabin for family routes and luggage-heavy trips.",
    status: CarStatus.AVAILABLE,
    minAdvanceBookingHr: 4,
    maxBookingDays: 14,
    bufferHours: 3,
    images: ["https://images.example.com/cars/serena-cover.jpg"],
    options: [
      {
        name: "Wifi Router",
        pricePerDay: "250",
        description: "Pocket wifi for travel.",
      },
      {
        name: "Child Seat",
        pricePerDay: "200",
        description: "Family-ready child seat.",
      },
    ],
  },
  {
    key: "bangkok-accord-exec",
    name: "Honda Accord Executive",
    brand: "Honda",
    model: "Accord",
    year: 2024,
    category: CarCategory.LUXURY,
    countryCode: "TH",
    city: "Bangkok",
    timezone: "Asia/Bangkok",
    currencyCode: "THB",
    hourlyRate: "350",
    dailyRate: "2100",
    seats: 5,
    transmission: "AUTOMATIC",
    fuelType: "Petrol",
    description: "Comfort-focused sedan for business transfers.",
    status: CarStatus.AVAILABLE,
    minAdvanceBookingHr: 2,
    maxBookingDays: 21,
    bufferHours: 2,
    images: ["https://images.example.com/cars/accord-cover.jpg"],
    options: [
      {
        name: "Premium Insurance",
        pricePerDay: "350",
        description: "Reduced excess for business trips.",
      },
    ],
    blockedBooking: {
      pickupAt: new Date("2026-05-20T08:00:00.000Z"),
      returnAt: new Date("2026-05-21T20:00:00.000Z"),
    },
  },
  {
    key: "chiangmai-atto-3",
    name: "BYD Atto 3 Touring",
    brand: "BYD",
    model: "Atto 3",
    year: 2025,
    category: CarCategory.ELECTRIC,
    countryCode: "TH",
    city: "Chiang Mai",
    timezone: "Asia/Bangkok",
    currencyCode: "THB",
    hourlyRate: "420",
    dailyRate: "2400",
    seats: 5,
    transmission: "AUTOMATIC",
    fuelType: "Electric",
    description: "Low running cost with ideal range for northern loops.",
    status: CarStatus.AVAILABLE,
    minAdvanceBookingHr: 3,
    maxBookingDays: 21,
    bufferHours: 2,
    images: ["https://images.example.com/cars/atto-3-cover.jpg"],
    options: [
      {
        name: "EV Charging Card",
        pricePerDay: "180",
        description: "Charging network card for longer routes.",
      },
    ],
  },
  {
    key: "paris-peugeot-3008",
    name: "Peugeot 3008 Crosscity",
    brand: "Peugeot",
    model: "3008",
    year: 2024,
    category: CarCategory.SUV,
    countryCode: "FR",
    city: "Paris",
    timezone: "Europe/Paris",
    currencyCode: "EUR",
    hourlyRate: "18",
    dailyRate: "110",
    seats: 5,
    transmission: "AUTOMATIC",
    fuelType: "Diesel",
    description: "Balanced SUV for city arrival and regional drives.",
    status: CarStatus.AVAILABLE,
    minAdvanceBookingHr: 4,
    maxBookingDays: 30,
    bufferHours: 2,
    images: ["https://images.example.com/cars/peugeot-3008-cover.jpg"],
    options: [
      {
        name: "Low Emission Zone Kit",
        pricePerDay: "12",
        description: "City-ready kit for regulated routes.",
      },
    ],
  },
  {
    key: "zurich-xc60-snow",
    name: "Volvo XC60 Alpine",
    brand: "Volvo",
    model: "XC60",
    year: 2025,
    category: CarCategory.SUV,
    countryCode: "CH",
    city: "Zurich",
    timezone: "Europe/Zurich",
    currencyCode: "CHF",
    hourlyRate: "24",
    dailyRate: "155",
    seats: 5,
    transmission: "AUTOMATIC",
    fuelType: "Hybrid",
    description: "Winter-capable SUV with premium long-distance comfort.",
    status: CarStatus.MAINTENANCE,
    minAdvanceBookingHr: 6,
    maxBookingDays: 14,
    bufferHours: 4,
    images: ["https://images.example.com/cars/xc60-cover.jpg"],
    options: [
      {
        name: "Snow Gear Pack",
        pricePerDay: "25",
        description: "Snow chains and winter route essentials.",
      },
    ],
  },
];

async function clearDatabase() {
  await prisma.bookingOption.deleteMany();
  await prisma.pricingSnapshot.deleteMany();
  await prisma.bookingStatusLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.locationSpecialHours.deleteMany();
  await prisma.locationHours.deleteMany();
  await prisma.carImage.deleteMany();
  await prisma.carOption.deleteMany();
  await prisma.car.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function createBlockedBooking(params: {
  userId: string;
  carId: string;
  pickupAt: Date;
  returnAt: Date;
  timezone: string;
  hourlyRate: string;
  dailyRate: string;
  currencyCode: string;
}) {
  await prisma.booking.create({
    data: {
      userId: params.userId,
      carId: params.carId,
      pickupAt: params.pickupAt,
      returnAt: params.returnAt,
      pickupTimezone: params.timezone,
      totalHours: "24",
      totalDays: 1,
      subtotal: params.dailyRate,
      optionsTotal: "0",
      grandTotal: params.dailyRate,
      currencyCode: params.currencyCode,
      exchangeRate: "1.000000",
      pricingMode: PricingMode.DAILY,
      status: BookingStatus.APPROVED,
      pricingSnapshot: {
        create: {
          hourlyRate: params.hourlyRate,
          dailyRate: params.dailyRate,
          currencyCode: params.currencyCode,
          exchangeRate: "1.000000",
          calculationDetail: {
            segments: [
              {
                label: "Seeded blocked availability",
                mode: "DAILY",
                days: 1,
                cost: Number(params.dailyRate),
              },
            ],
            subtotal: Number(params.dailyRate),
            optionsTotal: 0,
            grandTotal: Number(params.dailyRate),
          },
        },
      },
    },
  });
}

async function main() {
  await clearDatabase();

  const customer = await prisma.user.create({
    data: {
      email: "john@example.com",
      passwordHash: "seed-password-hash",
      firstName: "John",
      lastName: "Doe",
      phone: "+66812345678",
      countryCode: "TH",
      timezone: "Asia/Bangkok",
      currencyCode: "THB",
    },
  });

  const createdCars: Car[] = [];

  for (const car of cars) {
    const createdCar = await prisma.car.create({
      data: {
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        category: car.category,
        countryCode: car.countryCode,
        city: car.city,
        timezone: car.timezone,
        currencyCode: car.currencyCode,
        hourlyRate: car.hourlyRate,
        dailyRate: car.dailyRate,
        seats: car.seats,
        transmission: car.transmission,
        fuelType: car.fuelType,
        description: car.description,
        is24Hours: false,
        minAdvanceBookingHr: car.minAdvanceBookingHr,
        maxBookingDays: car.maxBookingDays,
        bufferHours: car.bufferHours,
        status: car.status,
        images: {
          create: car.images.map((url, index) => ({
            url,
            sortOrder: index,
            isCover: index === 0,
          })),
        },
        options: {
          create: car.options,
        },
        locationHours: {
          create: regularLocationHours,
        },
      },
    });

    if (car.blockedBooking) {
      await createBlockedBooking({
        userId: customer.id,
        carId: createdCar.id,
        pickupAt: car.blockedBooking.pickupAt,
        returnAt: car.blockedBooking.returnAt,
        timezone: car.timezone,
        hourlyRate: car.hourlyRate,
        dailyRate: car.dailyRate,
        currencyCode: car.currencyCode,
      });
    }

    createdCars.push(createdCar);
  }

  console.log(`Seeded cars: ${createdCars.map((car) => car.name).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
