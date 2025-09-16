import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Formats a year as a financial year string (e.g., 2023 -> "2023-24")
 * @param year The base year (e.g., 2023 for FY 2023-24)
 * @returns Formatted financial year string
 */
export const formatFinancialYear = (year: number): string => {
  return `${year}-${(year + 1).toString().slice(-2)}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string) {
  if (typeof window !== 'undefined') return path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`
  return `http://localhost:${process.env.PORT ?? 3000}${path}`
}
