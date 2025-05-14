/**
 * Simple and reliable date/time formatting using dayjs
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Gets the timezone abbreviation for common timezones
 */
export const getTimeZoneAbbreviation = (timeZone: string | null): string => {
  if (!timeZone) return '';

  const abbreviations: { [key: string]: string } = {
    'Asia/Kolkata': 'IST',
    'Asia/Delhi': 'IST', 
    'Asia/Mumbai': 'IST',
    'Asia/Chennai': 'IST',
    'America/New_York': 'EST',
    'America/Los_Angeles': 'PST',
    'America/Chicago': 'CST',
    'America/Denver': 'MST',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
    'Asia/Singapore': 'SGT',
    'Australia/Sydney': 'AEDT',
    'UTC': 'UTC',
  };

  return abbreviations[timeZone] || '';
};

/**
 * Formats a date string (DATE ONLY)
 * @param dateString ISO date string to format
 * @param timeZone Time zone (only used for timezone-aware date conversion if needed)
 * @returns Formatted date string (e.g., "May 14, 2025")
 */
export const formatDateToTimeZone = (
  dateString: string,
  timeZone: string | null
): string => {
  if (!dateString) return 'Not set';

  try {
    // Parse the date as UTC first
    let date = dayjs.utc(dateString);

    // If timezone is provided, convert to that timezone
    if (timeZone) {
      date = date.tz(timeZone);
    }

    // Format as date only
    return date.format('MMM D, YYYY');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a time string with timezone abbreviation
 * @param dateString ISO date string to format
 * @param timeZone Time zone to format the time in
 * @returns Formatted time string with timezone (e.g., "5:30 AM IST")
 */
export const formatTimeToTimeZone = (
  dateString: string,
  timeZone: string | null
): string => {
  if (!dateString) return '';

  try {
    // Parse the date as UTC first
    let date = dayjs.utc(dateString);

    // If timezone is provided, convert to that timezone
    if (timeZone) {
      date = date.tz(timeZone);
    }

    // Format as time only
    const timeString = date.format('h:mm A');

    // Add timezone abbreviation if available
    const timeZoneAbbr = getTimeZoneAbbreviation(timeZone);

    return timeZoneAbbr ? `${timeString} ${timeZoneAbbr}` : timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Formats a date and time string 
 * @param dateString ISO date string to format
 * @param timeZone Time zone to format in
 * @returns Formatted date and time string
 */
export const formatDateTimeToTimeZone = (
  dateString: string,
  timeZone: string | null
): string => {
  if (!dateString) return 'Not set';

  try {
    // Parse the date as UTC first
    let date = dayjs.utc(dateString);

    // If timezone is provided, convert to that timezone
    if (timeZone) {
      date = date.tz(timeZone);
    }

    // Format as date and time
    return date.format('MMM D, YYYY h:mm A');
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Invalid date';
  }
};

/**
 * Gets the current date and time in the specified time zone
 */
export const getCurrentTimeInTimeZone = (
  timeZone: string | null
): string => {
  const now = dayjs();
  if (timeZone) {
    return now.tz(timeZone).format('MMM D, YYYY h:mm A');
  }
  return now.format('MMM D, YYYY h:mm A');
};