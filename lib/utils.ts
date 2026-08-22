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
