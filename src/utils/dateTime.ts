import { format, parseISO, formatInTimeZone } from 'date-fns-tz';

/**
 * Formats a date string according to the specified time zone
 * @param dateString ISO date string to format
 * @param timeZone Time zone to format the date in (e.g., 'America/New_York', 'Asia/Kolkata')
 * @param formatStr Optional format string (defaults to 'MMM d, yyyy')
 * @returns Formatted date string in the specified time zone
 */
export const formatDateToTimeZone = (
  dateString: string,
  timeZone: string | null,
  formatStr: string = 'MMM d, yyyy'
): string => {
  if (!dateString) return 'Not set';

  try {
    // Parse the ISO date string
    const date = parseISO(dateString);

    // If no time zone is provided, use the local time zone
    if (!timeZone) {
      return format(date, formatStr);
    }

    // Format the date in the specified time zone
    return formatInTimeZone(date, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a time string according to the specified time zone
 * @param dateString ISO date string to format
 * @param timeZone Time zone to format the time in (e.g., 'America/New_York', 'Asia/Kolkata')
 * @param formatStr Optional format string (defaults to 'h:mm a')
 * @returns Formatted time string in the specified time zone
 */
export const formatTimeToTimeZone = (
  dateString: string,
  timeZone: string | null,
  formatStr: string = 'h:mm a'
): string => {
  if (!dateString) return '';

  try {
    // Parse the ISO date string
    const date = parseISO(dateString);

    // If no time zone is provided, use the local time zone
    if (!timeZone) {
      return format(date, formatStr);
    }

    // Format the time in the specified time zone
    return formatInTimeZone(date, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Formats a date and time string according to the specified time zone
 * @param dateString ISO date string to format
 * @param timeZone Time zone to format the date and time in (e.g., 'America/New_York', 'Asia/Kolkata')
 * @param formatStr Optional format string (defaults to 'MMM d, yyyy h:mm a')
 * @returns Formatted date and time string in the specified time zone
 */
export const formatDateTimeToTimeZone = (
  dateString: string,
  timeZone: string | null,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string => {
  if (!dateString) return 'Not set';

  try {
    // Parse the ISO date string
    const date = parseISO(dateString);

    // If no time zone is provided, use the local time zone
    if (!timeZone) {
      return format(date, formatStr);
    }

    // Format the date and time in the specified time zone
    return formatInTimeZone(date, timeZone, formatStr);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Invalid date';
  }
};