import {
  differenceInCalendarDays,
  addDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from "date-fns";

export interface DateDifferenceResult {
  totalDays: number;
  years: number;
  months: number;
  weeks: number;
}

export function calculateDateDifference(
  start: Date,
  end: Date,
): DateDifferenceResult {
  const [earlier, later] =
    start.getTime() <= end.getTime() ? [start, end] : [end, start];
  const totalDays = differenceInCalendarDays(later, earlier);
  return {
    totalDays,
    years: differenceInCalendarYears(later, earlier),
    months: differenceInCalendarMonths(later, earlier),
    weeks: Math.floor(totalDays / 7),
  };
}

export function addDaysToDate(start: Date, days: number): Date {
  return addDays(start, days);
}
