import type { Course, Section } from './catalog';

/**
 * Represents a selected section for a specific course in a schedule
 */
export interface ScheduleEntry {
	courseId: string; // Unique identifier for the course
	courseCatalogNumber: string; // e.g., "CS 131"
	courseDepartment: string; // Department name
	courseTitle: string; // Course title
	selectedLecture: Section | null; // Selected lecture section
	selectedLab: Section | null; // Selected lab section (if applicable)
	color: string; // UI color for visualization (hex code)
}

/**
 * A complete schedule with a name and collection of entries
 */
export interface Schedule {
	id: string; // UUID for the schedule
	name: string; // User-defined name (e.g., "Plan A")
	entries: ScheduleEntry[]; // All course entries in this schedule
	createdAt: number; // Timestamp
	updatedAt: number; // Timestamp
}

/**
 * Global scheduler state
 */
export interface SchedulerState {
	schedules: Schedule[]; // All saved schedules
	activeScheduleId: string | null; // Currently active schedule ID
}

/**
 * Time conflict between two sections
 */
export interface TimeConflict {
	section1: Section;
	section2: Section;
	course1: string; // Course catalog number
	course2: string;
	day: string; // Day of conflict (e.g., "Mon")
}

/**
 * Auto-scheduler priority configuration
 */
export interface SchedulerPreferences {
	minimizeGaps: boolean; // Minimize time gaps between classes
	avoidEarlyMorning: boolean; // Avoid classes before 9 AM
	maximizeFreeDays: boolean; // Prefer fewer days per week
	preferredInstructors: string[]; // List of preferred instructor names
	preferredInstructorsEnabled: boolean; // Whether to use instructor preference
}

/**
 * A generated schedule option from auto-scheduler
 */
export interface GeneratedSchedule {
	id: string; // UUID for this option
	entries: ScheduleEntry[]; // The schedule entries
	score: number; // Overall score based on preferences (0-100)
	metrics: {
		totalGapMinutes: number; // Total gap time across all days
		earlyMorningClasses: number; // Count of classes before 9 AM
		daysPerWeek: number; // Number of days with classes
		preferredInstructorMatches: number; // Count of preferred instructors
	};
}
