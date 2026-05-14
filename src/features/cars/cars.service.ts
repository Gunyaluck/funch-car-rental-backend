import { BookingStatus, CarStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { ListCarsQuery } from "./cars.schemas.js";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
];

const listCarSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  year: true,
  category: true,
  countryCode: true,
  city: true,
  timezone: true,
  currencyCode: true,
  hourlyRate: true,
  dailyRate: true,
  seats: true,
  transmission: true,
  fuelType: true,
  bufferHours: true,
  status: true,
  images: {
    select: {
      url: true,
      isCover: true,
      sortOrder: true,
    },
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
  },
  bookings: {
    where: {
      status: {
        in: ACTIVE_BOOKING_STATUSES,
      },
    },
    select: {
      pickupAt: true,
      returnAt: true,
    },
  },
} satisfies Prisma.CarSelect;

const detailCarSelect = {
  id: true,
  name: true,
  brand: true,
  model: true,
  year: true,
  category: true,
  countryCode: true,
  city: true,
  timezone: true,
  currencyCode: true,
  hourlyRate: true,
  dailyRate: true,
  seats: true,
  transmission: true,
  fuelType: true,
  description: true,
  status: true,
  is24Hours: true,
  minAdvanceBookingHr: true,
  maxBookingDays: true,
  bufferHours: true,
  images: {
    select: {
      id: true,
      url: true,
      sortOrder: true,
      isCover: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  },
  options: {
    select: {
      id: true,
      name: true,
      pricePerDay: true,
      description: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  },
  locationHours: {
    select: {
      dayOfWeek: true,
      openTime: true,
      closeTime: true,
      isClosed: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.CarSelect;

const buildCarWhere = (query: ListCarsQuery): Prisma.CarWhereInput => {
  const where: Prisma.CarWhereInput = {};

  if (query.countryCode) {
    where.countryCode = query.countryCode.toUpperCase();
  }

  if (query.city) {
    where.city = {
      equals: query.city,
      mode: "insensitive",
    };
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.transmission) {
    where.transmission = {
      equals: query.transmission,
      mode: "insensitive",
    };
  }

  if (query.seats) {
    where.seats = query.seats;
  }

  return where;
};

const hasOverlapWithBuffer = (
  bookings: Array<{ pickupAt: Date; returnAt: Date }>,
  pickupAt: Date,
  returnAt: Date,
  bufferHours: number,
) => {
  const bufferMs = bufferHours * 60 * 60 * 1000;

  return bookings.some((booking) => {
    const bufferedReturnAt = new Date(booking.returnAt.getTime() + bufferMs);
    return booking.pickupAt < returnAt && bufferedReturnAt > pickupAt;
  });
};

const toNumber = (value: Prisma.Decimal) => Number(value);

export const listCars = async (query: ListCarsQuery) => {
  const { page, limit, pickupAt, returnAt } = query;
  const where = buildCarWhere(query);
  const shouldFilterByAvailability = Boolean(pickupAt && returnAt);

  const cars = await prisma.car.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: listCarSelect,
  });

  const mappedCars = cars.map((car) => {
    const coverImage = car.images.find((image) => image.isCover)?.url ?? car.images[0]?.url ?? null;
    const hasRequestedSchedule = shouldFilterByAvailability && pickupAt && returnAt;
    const isAvailable =
      car.status === CarStatus.AVAILABLE &&
      (!hasRequestedSchedule ||
        !hasOverlapWithBuffer(car.bookings, pickupAt, returnAt, car.bufferHours));

    return {
      id: car.id,
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year,
      category: car.category,
      countryCode: car.countryCode,
      city: car.city,
      timezone: car.timezone,
      currencyCode: car.currencyCode,
      hourlyRate: toNumber(car.hourlyRate),
      dailyRate: toNumber(car.dailyRate),
      seats: car.seats,
      transmission: car.transmission,
      fuelType: car.fuelType,
      status: car.status,
      coverImage,
      isAvailable,
    };
  });

  const filteredCars = shouldFilterByAvailability
    ? mappedCars.filter((car) => car.isAvailable)
    : mappedCars;

  const total = filteredCars.length;
  const skip = (page - 1) * limit;
  const data = filteredCars.slice(skip, skip + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
    },
  };
};

export const getCarById = async (id: string) => {
  const car = await prisma.car.findUnique({
    where: { id },
    select: detailCarSelect,
  });

  if (!car) {
    return null;
  }

  return {
    data: {
      id: car.id,
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year,
      category: car.category,
      countryCode: car.countryCode,
      city: car.city,
      timezone: car.timezone,
      currencyCode: car.currencyCode,
      hourlyRate: toNumber(car.hourlyRate),
      dailyRate: toNumber(car.dailyRate),
      seats: car.seats,
      transmission: car.transmission,
      fuelType: car.fuelType,
      description: car.description,
      status: car.status,
      is24Hours: car.is24Hours,
      minAdvanceBookingHr: car.minAdvanceBookingHr,
      maxBookingDays: car.maxBookingDays,
      bufferHours: car.bufferHours,
      images: car.images,
      options: car.options.map((option) => ({
        ...option,
        pricePerDay: toNumber(option.pricePerDay),
      })),
      locationHours: car.locationHours,
    },
  };
};
