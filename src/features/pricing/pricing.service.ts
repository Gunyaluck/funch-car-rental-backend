import { BookingStatus, CarStatus, PricingMode, Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type { QuotePricingInput } from "./pricing.schemas.js";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DAILY_CUTOFF_HOUR = 14;
const MAX_HOURLY_HOURS_PER_CYCLE = 8;

const carSelect = {
  id: true,
  timezone: true,
  currencyCode: true,
  hourlyRate: true,
  dailyRate: true,
  status: true,
  is24Hours: true,
  maxBookingDays: true,
  minAdvanceBookingHr: true,
  bufferHours: true,
  options: {
    select: {
      id: true,
      name: true,
      pricePerDay: true,
    },
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
  locationHours: {
    select: {
      dayOfWeek: true,
      openTime: true,
      closeTime: true,
      isClosed: true,
    },
  },
  specialHours: {
    select: {
      date: true,
      isClosed: true,
      openTime: true,
      closeTime: true,
    },
  },
} satisfies Prisma.CarSelect;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
  dateKey: string;
};

type BreakdownItem = {
  label: string;
  type: "DAILY" | "HOURLY";
  quantity: number;
  unitPrice: number;
  total: number;
};

const toNumber = (value: Prisma.Decimal) => Number(value);

const getZonedParts = (date: Date, timezone: string): ZonedParts => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const year = Number(getPart("year"));
  const month = Number(getPart("month"));
  const day = Number(getPart("day"));
  const hour = Number(getPart("hour"));
  const minute = Number(getPart("minute"));
  const weekday = getPart("weekday") ?? "";

  return {
    year,
    month,
    day,
    hour,
    minute,
    dayOfWeek: weekdayMap[weekday] ?? 0,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
};

const minutesFromTime = (time: string) => {
  const [hourText, minuteText] = time.split(":");
  return Number(hourText) * 60 + Number(minuteText);
};

const minutesFromDate = (date: Date, timezone: string) => {
  const parts = getZonedParts(date, timezone);
  return parts.hour * 60 + parts.minute;
};

const isAfterDailyCutoff = (date: Date, timezone: string) => {
  const parts = getZonedParts(date, timezone);
  return parts.hour > DAILY_CUTOFF_HOUR || (parts.hour === DAILY_CUTOFF_HOUR && parts.minute > 0);
};

const isWithinOperatingHours = (
  date: Date,
  timezone: string,
  car: Prisma.CarGetPayload<{ select: typeof carSelect }>,
) => {
  if (car.is24Hours) {
    return true;
  }

  const local = getZonedParts(date, timezone);
  const specialHours = car.specialHours.find((hours) => {
    const specialDateKey = getZonedParts(hours.date, timezone).dateKey;
    return specialDateKey === local.dateKey;
  });

  if (specialHours) {
    if (specialHours.isClosed || !specialHours.openTime || !specialHours.closeTime) {
      return false;
    }

    const currentMinutes = minutesFromDate(date, timezone);
    return (
      currentMinutes >= minutesFromTime(specialHours.openTime) &&
      currentMinutes <= minutesFromTime(specialHours.closeTime)
    );
  }

  const regularHours = car.locationHours.find((hours) => hours.dayOfWeek === local.dayOfWeek);

  if (!regularHours || regularHours.isClosed) {
    return false;
  }

  const currentMinutes = minutesFromDate(date, timezone);
  return (
    currentMinutes >= minutesFromTime(regularHours.openTime) &&
    currentMinutes <= minutesFromTime(regularHours.closeTime)
  );
};

const hasBookingConflict = (
  bookings: Array<{ pickupAt: Date; returnAt: Date }>,
  pickupAt: Date,
  returnAt: Date,
  bufferHours: number,
) => {
  const bufferMs = bufferHours * HOUR_MS;
  const requestedBufferedReturnAt = new Date(returnAt.getTime() + bufferMs);

  return bookings.some((booking) => {
    const existingBufferedReturnAt = new Date(booking.returnAt.getTime() + bufferMs);
    return pickupAt < existingBufferedReturnAt && booking.pickupAt < requestedBufferedReturnAt;
  });
};

const calculateRentalPrice = (params: {
  pickupAt: Date;
  returnAt: Date;
  timezone: string;
  hourlyRate: number;
  dailyRate: number;
}) => {
  const breakdown: BreakdownItem[] = [];
  let totalDays = 0;
  let totalHours = 0;
  let cycleStart = params.pickupAt;

  while (cycleStart < params.returnAt) {
    const nextCycleStart = new Date(cycleStart.getTime() + DAY_MS);

    if (params.returnAt >= nextCycleStart) {
      totalDays += 1;
      breakdown.push({
        label: `Day ${totalDays}`,
        type: "DAILY",
        quantity: 1,
        unitPrice: params.dailyRate,
        total: params.dailyRate,
      });
      cycleStart = nextCycleStart;
      continue;
    }

    const remainingHours = Math.ceil((params.returnAt.getTime() - cycleStart.getTime()) / HOUR_MS);

    if (
      remainingHours > MAX_HOURLY_HOURS_PER_CYCLE ||
      isAfterDailyCutoff(params.returnAt, params.timezone)
    ) {
      totalDays += 1;
      breakdown.push({
        label: `Day ${totalDays}`,
        type: "DAILY",
        quantity: 1,
        unitPrice: params.dailyRate,
        total: params.dailyRate,
      });
    } else {
      totalHours += remainingHours;
      breakdown.push({
        label: totalDays > 0 ? "Extra hour" : "Hourly rental",
        type: "HOURLY",
        quantity: remainingHours,
        unitPrice: params.hourlyRate,
        total: remainingHours * params.hourlyRate,
      });
    }

    break;
  }

  const subtotal = breakdown.reduce((sum, item) => sum + item.total, 0);
  const pricingMode =
    totalDays > 0 && totalHours > 0
      ? PricingMode.MIXED
      : totalDays > 0
        ? PricingMode.DAILY
        : PricingMode.HOURLY;

  return {
    pricingMode,
    totalDays,
    totalHours,
    subtotal,
    breakdown,
  };
};

export const quotePricing = async (input: QuotePricingInput) => {
  const car = await prisma.car.findUnique({
    where: { id: input.carId },
    select: carSelect,
  });

  if (!car) {
    throw new AppError(404, "Car not found");
  }

  if (car.status !== CarStatus.AVAILABLE) {
    throw new AppError(400, "Car is not available for booking");
  }

  const advanceMs = input.pickupAt.getTime() - Date.now();
  if (advanceMs < car.minAdvanceBookingHr * HOUR_MS) {
    throw new AppError(400, `Pickup must be at least ${car.minAdvanceBookingHr} hours in advance`);
  }

  const rentalDays = (input.returnAt.getTime() - input.pickupAt.getTime()) / DAY_MS;
  if (rentalDays > car.maxBookingDays) {
    throw new AppError(400, `Rental duration cannot exceed ${car.maxBookingDays} days`);
  }

  if (
    !isWithinOperatingHours(input.pickupAt, car.timezone, car) ||
    !isWithinOperatingHours(input.returnAt, car.timezone, car)
  ) {
    throw new AppError(400, "Pickup and return must be within operating hours");
  }

  if (hasBookingConflict(car.bookings, input.pickupAt, input.returnAt, car.bufferHours)) {
    throw new AppError(409, "Car is not available for the requested period");
  }

  const optionIds = [...new Set(input.optionIds)];
  const selectedOptions = car.options.filter((option) => optionIds.includes(option.id));

  if (selectedOptions.length !== optionIds.length) {
    throw new AppError(400, "One or more selected options are invalid for this car");
  }

  const hourlyRate = toNumber(car.hourlyRate);
  const dailyRate = toNumber(car.dailyRate);
  const price = calculateRentalPrice({
    pickupAt: input.pickupAt,
    returnAt: input.returnAt,
    timezone: car.timezone,
    hourlyRate,
    dailyRate,
  });
  const optionChargeDays = Math.max(1, price.totalDays);
  const quotedOptions = selectedOptions.map((option) => {
    const pricePerDay = toNumber(option.pricePerDay);

    return {
      id: option.id,
      name: option.name,
      pricePerDay,
      total: pricePerDay * optionChargeDays,
    };
  });
  const optionsTotal = quotedOptions.reduce((sum, option) => sum + option.total, 0);

  return {
    carId: car.id,
    pickupAt: input.pickupAt.toISOString(),
    returnAt: input.returnAt.toISOString(),
    timezone: car.timezone,
    currencyCode: car.currencyCode,
    pricingMode: price.pricingMode,
    totalDays: price.totalDays,
    totalHours: price.totalHours,
    subtotal: price.subtotal,
    optionsTotal,
    grandTotal: price.subtotal + optionsTotal,
    breakdown: price.breakdown,
    selectedOptions: quotedOptions,
  };
};
