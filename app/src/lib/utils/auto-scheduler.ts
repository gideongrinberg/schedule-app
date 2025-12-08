import type { Course, Section } from '$lib/catalog';
import type { ScheduleEntry, GeneratedSchedule, SchedulerPreferences } from '$lib/scheduler.types';
import { sectionsConflict } from './scheduler';
import { nanoid } from 'nanoid';

/**
 * Generate all possible valid schedule combinations
 * Uses backtracking to find schedules without conflicts
 */
export function generateSchedules(
	courses: Course[],
	preferences: SchedulerPreferences,
	maxSchedules: number = 50
): GeneratedSchedule[] {
	const validSchedules: GeneratedSchedule[] = [];
	const colors = generateColorPalette(courses.length);

	// Early exit if no courses
	if (courses.length === 0) return [];

	// Build section choices for each course
	const courseSectionChoices: Array<{
		course: Course;
		lectureOptions: Section[];
		labOptions: Section[];
		color: string;
	}> = courses.map((course, idx) => ({
		course,
		lectureOptions: course.sections.lecture,
		labOptions: course.sections.lab || [],
		color: colors[idx]
	}));

	/**
	 * Recursive backtracking function
	 */
	function backtrack(courseIndex: number, currentEntries: ScheduleEntry[]): void {
		// Base case: we've assigned sections for all courses
		if (courseIndex === courseSectionChoices.length) {
			// Score and add this valid schedule
			const scored = scoreSchedule(currentEntries, preferences);
			validSchedules.push(scored);
			return;
		}

		// Stop if we've found enough schedules (performance optimization)
		if (validSchedules.length >= maxSchedules) {
			return;
		}

		const { course, lectureOptions, labOptions, color } = courseSectionChoices[courseIndex];

		// Try each lecture section
		for (const lecture of lectureOptions) {
			// Check if this lecture conflicts with current schedule
			if (hasConflictWithSchedule(lecture, currentEntries)) {
				continue;
			}

			// If course has no labs, create entry with just lecture
			if (labOptions.length === 0) {
				const entry: ScheduleEntry = {
					courseId: course.id,
					courseCatalogNumber: course.catalogNumber,
					courseDepartment: course.department,
					courseTitle: course.title,
					selectedLecture: lecture,
					selectedLab: null,
					color
				};

				backtrack(courseIndex + 1, [...currentEntries, entry]);
			} else {
				// Try each lab section
				for (const lab of labOptions) {
					// Check if lab conflicts with current schedule or the lecture
					if (
						hasConflictWithSchedule(lab, currentEntries) ||
						sectionsConflict(lecture, lab).conflicts
					) {
						continue;
					}

					const entry: ScheduleEntry = {
						courseId: course.id,
						courseCatalogNumber: course.catalogNumber,
						courseDepartment: course.department,
						courseTitle: course.title,
						selectedLecture: lecture,
						selectedLab: lab,
						color
					};

					backtrack(courseIndex + 1, [...currentEntries, entry]);
				}
			}
		}
	}

	// Start backtracking
	backtrack(0, []);

	// Sort by score (descending)
	return validSchedules.sort((a, b) => b.score - a.score);
}

/**
 * Check if a section conflicts with any section in current entries
 */
function hasConflictWithSchedule(section: Section, entries: ScheduleEntry[]): boolean {
	for (const entry of entries) {
		if (entry.selectedLecture && sectionsConflict(section, entry.selectedLecture).conflicts) {
			return true;
		}
		if (entry.selectedLab && sectionsConflict(section, entry.selectedLab).conflicts) {
			return true;
		}
	}
	return false;
}

/**
 * Score a schedule based on preferences
 */
function scoreSchedule(
	entries: ScheduleEntry[],
	preferences: SchedulerPreferences
): GeneratedSchedule {
	const metrics = calculateMetrics(entries, preferences);

	// Calculate weighted score (0-100)
	let score = 100;

	// Penalize gaps (each hour of gap = -2 points)
	if (preferences.minimizeGaps) {
		score -= (metrics.totalGapMinutes / 60) * 2;
	}

	// Penalize early morning classes (<9 AM): -5 points each
	if (preferences.avoidEarlyMorning) {
		score -= metrics.earlyMorningClasses * 5;
	}

	// Reward free days (bonus based on days off)
	if (preferences.maximizeFreeDays) {
		const daysOff = 5 - metrics.daysPerWeek; // Assuming Mon-Fri
		score += daysOff * 10;
	}

	// Reward preferred instructors (+5 points each)
	if (preferences.preferredInstructorsEnabled && preferences.preferredInstructors.length > 0) {
		score += metrics.preferredInstructorMatches * 5;
	}

	return {
		id: nanoid(),
		entries,
		score: Math.max(0, Math.min(100, score)), // Clamp to 0-100
		metrics
	};
}

/**
 * Calculate schedule metrics
 */
function calculateMetrics(entries: ScheduleEntry[], preferences: SchedulerPreferences) {
	let totalGapMinutes = 0;
	let earlyMorningClasses = 0;
	const daysWithClasses = new Set<string>();
	let preferredInstructorMatches = 0;

	// Organize sections by day
	const sectionsByDay = new Map<string, Array<{ start: number; end: number }>>();

	entries.forEach((entry) => {
		[entry.selectedLecture, entry.selectedLab].forEach((section) => {
			if (!section || !section.time || !section.days) return;

			const [start, end] = section.time;

			// Check for early morning (before 9 AM = 540 minutes)
			if (start < 540) {
				earlyMorningClasses++;
			}

			// Track preferred instructors
			if (preferences.preferredInstructorsEnabled && section.instructor) {
				const hasPreferredInstructor = section.instructor.some((inst) =>
					preferences.preferredInstructors.includes(inst)
				);
				if (hasPreferredInstructor) {
					preferredInstructorMatches++;
				}
			}

			// Add to daily schedule
			section.days.forEach((day) => {
				daysWithClasses.add(day);

				if (!sectionsByDay.has(day)) {
					sectionsByDay.set(day, []);
				}
				sectionsByDay.get(day)!.push({ start, end });
			});
		});
	});

	// Calculate gaps for each day
	sectionsByDay.forEach((daySchedule) => {
		// Sort by start time
		daySchedule.sort((a, b) => a.start - b.start);

		// Calculate gaps between consecutive classes
		for (let i = 0; i < daySchedule.length - 1; i++) {
			const gap = daySchedule[i + 1].start - daySchedule[i].end;
			if (gap > 0) {
				totalGapMinutes += gap;
			}
		}
	});

	return {
		totalGapMinutes,
		earlyMorningClasses,
		daysPerWeek: daysWithClasses.size,
		preferredInstructorMatches
	};
}

/**
 * Generate distinct colors for schedule visualization
 */
function generateColorPalette(count: number): string[] {
	const colors = [
		'#3b82f6', // blue
		'#10b981', // green
		'#f59e0b', // amber
		'#ef4444', // red
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#14b8a6', // teal
		'#f97316', // orange
		'#6366f1', // indigo
		'#84cc16' // lime
	];

	// Repeat if we need more colors
	const palette: string[] = [];
	for (let i = 0; i < count; i++) {
		palette.push(colors[i % colors.length]);
	}

	return palette;
}
