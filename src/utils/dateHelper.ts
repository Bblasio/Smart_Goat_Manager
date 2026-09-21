/**
 * Date and duration formatting utilities for Smart Goat Farm
 */

/**
 * Format days active into a realistic human-friendly string in years, months, and days.
 * E.g., 500 days -> "1 year, 4 months"
 * E.g., 75 days -> "2 months, 15 days"
 * E.g., 18 days -> "18 days"
 * E.g., 1 day -> "1 day"
 */
export function formatActiveDuration(days: number): string {
  if (!days || days <= 1) return '1 day';

  const years = Math.floor(days / 365);
  const remDaysAfterYears = days % 365;
  const months = Math.floor(remDaysAfterYears / 30);
  const remDays = remDaysAfterYears % 30;

  if (years > 0) {
    if (months > 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  if (months > 0) {
    if (remDays > 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}, ${remDays} ${remDays === 1 ? 'day' : 'days'}`;
    }
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * Format days active into a compact badge string.
 * E.g., 500 days -> "1y 4m"
 * E.g., 75 days -> "2m 15d"
 * E.g., 18 days -> "18d"
 */
export function formatActiveDurationCompact(days: number): string {
  if (!days || days <= 1) return '1d';

  const years = Math.floor(days / 365);
  const remDaysAfterYears = days % 365;
  const months = Math.floor(remDaysAfterYears / 30);
  const remDays = remDaysAfterYears % 30;

  if (years > 0) {
    if (months > 0) return `${years}y ${months}m`;
    return `${years}y`;
  }

  if (months > 0) {
    if (remDays > 0) return `${months}m ${remDays}d`;
    return `${months}m`;
  }

  return `${days}d`;
}
