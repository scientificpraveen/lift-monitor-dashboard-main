/**
 * timeUtils.js
 * 
 * Provides centralized timezone-aware utilities for the backend.
 * Uses native Node.js Intl.DateTimeFormat to avoid external dependencies.
 */

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a standard JavaScript Date object.
 * Prisma and PostgreSQL/SQLite expect standard Date objects (which are UTC internally).
 * The database driver and the frontend browser handle the timezone display automatically.
 * 
 * DO NOT ADD 5.5 HOURS to this, or the frontend will double-add the timezone.
 */
export const getCurrentDate = () => {
    return new Date();
};

/**
 * Returns the current date as a YYYY-MM-DD string, guaranteed to be evaluated
 * within the Asia/Kolkata timezone. This prevents the rollover bug where 3:00 AM IST 
 * would still be evaluated as the previous day in UTC.
 */
export const getISTDateString = (dateObj = new Date()) => {
    // Use Intl.DateTimeFormat to reliably get IST parts
    const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' inherently formats as YYYY-MM-DD
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(dateObj); // "YYYY-MM-DD"
};

/**
 * Returns the current time as an HH:mm string (24-hour), guaranteed to be evaluated
 * within the Asia/Kolkata timezone.
 */
export const getISTTimeString = (dateObj = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-GB', { // 'en-GB' inherently formats as 24-hour HH:mm
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return formatter.format(dateObj); // "HH:mm"
};
