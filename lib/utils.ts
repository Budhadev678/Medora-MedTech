import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cached high-performance Intl formatters (prevents costly re-instantiation per invocation)
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateOnlyFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Currency formatter for Indian Rupee (INR)
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return currencyFormatter.format(amount);
}

/**
 * Date formatter for standard medical timelines and reports
 */
export function formatDate(dateString: string | Date, includeTime = false): string {
  if (!dateString) return "";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);

  return includeTime ? dateTimeFormatter.format(date) : dateOnlyFormatter.format(date);
}

/**
 * Mask sensitive identity values (e.g. Aadhaar: XXXX XXXX 1234)
 */
export function maskIdentityNumber(num: string): string {
  if (!num) return "";
  const clean = num.replace(/\s+/g, "");
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `XXXX XXXX ${last4}`;
}

/**
 * Single source of truth for current calendar week boundaries
 * (Week runs Monday to Sunday).
 */
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Single source of truth for current calendar week boundaries
 * (Week runs Monday to Sunday).
 */
export function getCurrentCalendarWeekRange(refDate = new Date()) {
  const now = new Date(refDate);
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  // Calculate days since Monday (where Mon = 0, Tue = 1, ..., Sun = 6)
  const diffToMonday = (currentDayOfWeek + 6) % 7;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const todayStr = formatLocalDate(now);
  const mondayStr = formatLocalDate(monday);
  const sundayStr = formatLocalDate(sunday);

  return {
    monday,
    sunday,
    mondayStr,
    sundayStr,
    todayStr,
  };
}

/**
 * Checks if a target date is within the remaining bookable days of the current calendar week (today through Sunday)
 */
export function isDateWithinCurrentWeek(targetDateStr: string, refDate = new Date()): boolean {
  if (!targetDateStr) return false;
  const { todayStr, sundayStr } = getCurrentCalendarWeekRange(refDate);
  return targetDateStr >= todayStr && targetDateStr <= sundayStr;
}

/**
 * Returns remaining bookable dates in the current calendar week (Today -> Sunday)
 */
export function getRemainingCurrentWeekDates(refDate = new Date()) {
  const now = new Date(refDate);
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const daysUntilSunday = (7 - currentDayOfWeek) % 7; // If Sun (0), 0 remaining future days
  const totalDays = daysUntilSunday + 1; // including today

  const dates: { iso: string; dayName: string; dayNum: string; isToday: boolean }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = formatLocalDate(d);
    const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dayNum = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    dates.push({
      iso,
      dayName,
      dayNum,
      isToday: i === 0,
    });
  }

  return dates;
}


