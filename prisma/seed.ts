import { PrismaClient, BookingStatus, CarCategory, CarStatus, PricingMode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  const availableCar = await prisma.car.create({
    data: {
      name: "Toyota Yaris AT",
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
      fuelType: "PETROL",
      description: "Compact city car",
      is24Hours: false,
      minAdvanceBookingHr: 2,
      maxBookingDays: 30,
      bufferHours: 2,
      status: CarStatus.AVAILABLE,
      images: {
        create: [
          {
            url: "https://images.example.com/cars/yaris-cover.jpg",
            sortOrder: 0,
            isCover: true,
          },
          {
            url: "https://images.example.com/cars/yaris-side.jpg",
            sortOrder: 1,
            isCover: false,
          },
        ],
      },
      options: {
        create: [
          {
            name: "Child Seat",
            pricePerDay: "200",
            description: "Suitable for toddlers",
          },
          {
            name: "GPS",
            pricePerDay: "150",
            description: "Portable navigation device",
          },
        ],
      },
      locationHours: {
        create: [
          { dayOfWeek: 1, openTime: "08:00", closeTime: "20:00", isClosed: false },
          { dayOfWeek: 2, openTime: "08:00", closeTime: "20:00", isClosed: false },
          { dayOfWeek: 3, openTime: "08:00", closeTime: "20:00", isClosed: false },
          { dayOfWeek: 4, openTime: "08:00", closeTime: "20:00", isClosed: false },
          { dayOfWeek: 5, openTime: "08:00", closeTime: "20:00", isClosed: false },
          { dayOfWeek: 6, openTime: "09:00", closeTime: "18:00", isClosed: false },
          { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: false },
        ],
      },
    },
  });

  const busyCar = await prisma.car.create({
    data: {
      name: "Honda Freed",
      brand: "Honda",
      model: "Freed",
      year: 2023,
      category: CarCategory.VAN,
      countryCode: "JP",
      city: "Tokyo",
      timezone: "Asia/Tokyo",
      currencyCode: "JPY",
      hourlyRate: "1200",
      dailyRate: "6800",
      seats: 7,
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      description: "Spacious family van",
      is24Hours: true,
      minAdvanceBookingHr: 4,
      maxBookingDays: 14,
      bufferHours: 3,
      status: CarStatus.AVAILABLE,
      images: {
        create: [
          {
            url: "https://images.example.com/cars/freed-cover.jpg",
            sortOrder: 0,
            isCover: true,
          },
        ],
      },
      options: {
        create: [
          {
            name: "Wifi Router",
            pricePerDay: "250",
            description: "Pocket wifi for travel",
          },
        ],
      },
      locationHours: {
        create: [{ dayOfWeek: 1, openTime: "00:00", closeTime: "23:59", isClosed: false }],
      },
    },
  });

  const busyCarWifiOption = await prisma.carOption.findFirstOrThrow({
    where: {
      carId: busyCar.id,
      name: "Wifi Router",
    },
  });

  await prisma.booking.create({
    data: {
      userId: customer.id,
      carId: busyCar.id,
      pickupAt: new Date("2026-05-12T03:00:00.000Z"),
      returnAt: new Date("2026-05-13T04:00:00.000Z"),
      pickupTimezone: "Asia/Tokyo",
      totalHours: "25",
      totalDays: 1,
      subtotal: "7700",
      optionsTotal: "250",
      grandTotal: "7950",
      currencyCode: "JPY",
      exchangeRate: "1.000000",
      pricingMode: PricingMode.MIXED,
      status: BookingStatus.APPROVED,
      options: {
        create: [
          {
            carOptionId: busyCarWifiOption.id,
            name: "Wifi Router",
            pricePerDay: "250",
            totalPrice: "250",
          },
        ],
      },
      pricingSnapshot: {
        create: {
          hourlyRate: "1200",
          dailyRate: "6800",
          currencyCode: "JPY",
          exchangeRate: "1.000000",
          calculationDetail: {
            breakdown: [
              { label: "Day 1", type: "DAILY", quantity: 1, unitPrice: 6800, total: 6800 },
              { label: "Extra hour", type: "HOURLY", quantity: 1, unitPrice: 1200, total: 1200 },
            ],
          },
        },
      },
    },
  });

  console.log(`Seeded cars: ${availableCar.name}, ${busyCar.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
