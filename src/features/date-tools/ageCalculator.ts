export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
}

/**
 * Calendar-aware age breakdown (not a naive days/365 division), so leap
 * years are handled correctly: e.g. someone born Feb 29 on a leap year
 * still gets a correct years/months/days split against any target date.
 */
export function calculateAge(
  birthDate: Date,
  asOf: Date = new Date(),
): AgeBreakdown {
  if (birthDate.getTime() > asOf.getTime()) {
    throw new Error("Birth date must not be in the future.");
  }

  let years = asOf.getFullYear() - birthDate.getFullYear();
  let months = asOf.getMonth() - birthDate.getMonth();
  let days = asOf.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    // Days in the month before `asOf`'s month — correctly accounts for
    // leap Februaries because Date(y, m, 0) rolls back to the last day
    // of month m-1.
    const daysInPrevMonth = new Date(
      asOf.getFullYear(),
      asOf.getMonth(),
      0,
    ).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.floor(
    (asOf.getTime() - birthDate.getTime()) / msPerDay,
  );

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
  };
}
