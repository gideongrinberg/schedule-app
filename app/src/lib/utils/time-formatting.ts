/**
 * Convert minutes since midnight to formatted time string
 * @param minutes Minutes since midnight (e.g., 600 = 10:00 AM)
 * @returns Formatted time string (e.g., "10:00 AM")
 */
export function formatTime(minutes: number): string {
	if (minutes > 1440) {
		const wrapped = minutes % 1440;
		const hours = Math.floor(wrapped / 60);
		const mins = wrapped % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}⁺`;
	}

	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	const period = hours >= 12 ? 'PM' : 'AM';
	const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

	return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range
 * @param start Start time in minutes since midnight
 * @param end End time in minutes since midnight
 * @returns Formatted time range (e.g., "10:00 AM - 11:20 AM")
 */
export function formatTimeRange(start: number, end: number): string {
	return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Format an array of days
 * @param days Array of day abbreviations (e.g., ["Mon", "Wed", "Fri"])
 * @returns Formatted string (e.g., "Mon/Wed/Fri")
 */
export function formatDays(days: string[]): string {
	return days.join('/');
}

/**
 * Format section time and days for display
 * @param time Time tuple [start, end] or null
 * @param days Array of days or undefined
 * @returns Formatted string (e.g., "Mon/Wed 10:00 AM - 11:20 AM" or "Online")
 */
export function formatSectionSchedule(
	time: [number, number] | null,
	days: string[] | undefined
): string {
	if (!time || !days || days.length === 0) {
		return 'Online/Asynchronous';
	}

	return `${formatDays(days)} ${formatTimeRange(time[0], time[1])}`;
}

/**
 * Calculate duration in minutes
 * @param start Start time in minutes
 * @param end End time in minutes
 * @returns Duration in minutes
 */
export function getDuration(start: number, end: number): number {
	return end - start;
}

/**
 * Convert minutes to hours and minutes display
 * @param minutes Total minutes
 * @returns Formatted string (e.g., "1h 30m")
 */
export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (hours === 0) {
		return `${mins}m`;
	} else if (mins === 0) {
		return `${hours}h`;
	} else {
		return `${hours}h ${mins}m`;
	}
}
