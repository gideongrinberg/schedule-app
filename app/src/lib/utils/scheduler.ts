import type { Section } from '$lib/catalog';
import type { ScheduleEntry, TimeConflict } from '$lib/scheduler.types';

/**
 * Check if two time ranges overlap
 * @param time1 First time range [start, end]
 * @param time2 Second time range [start, end]
 * @returns True if the ranges overlap
 */
export function timeRangesOverlap(time1: [number, number], time2: [number, number]): boolean {
	const [start1, end1] = time1;
	const [start2, end2] = time2;

	// Ranges overlap if: start1 < end2 AND start2 < end1
	return start1 < end2 && start2 < end1;
}

/**
 * Check if two sections have a time conflict
 * @param section1 First section
 * @param section2 Second section
 * @returns Object with conflicts flag and array of conflicting days
 */
export function sectionsConflict(
	section1: Section,
	section2: Section
): { conflicts: boolean; days: string[] } {
	// If either section has no time, no conflict
	if (!section1.time || !section2.time) {
		return { conflicts: false, days: [] };
	}

	// If either section has no days, no conflict (online/async courses)
	if (!section1.days || !section2.days || section1.days.length === 0 || section2.days.length === 0) {
		return { conflicts: false, days: [] };
	}

	// Find common days
	const commonDays = section1.days.filter((day) => section2.days!.includes(day));

	if (commonDays.length === 0) {
		return { conflicts: false, days: [] };
	}

	// Check if times overlap on common days
	const timesOverlap = timeRangesOverlap(section1.time, section2.time);

	return {
		conflicts: timesOverlap,
		days: timesOverlap ? commonDays : []
	};
}

/**
 * Find all conflicts in a schedule
 * @param entries All schedule entries to check
 * @returns Array of time conflicts
 */
export function findScheduleConflicts(entries: ScheduleEntry[]): TimeConflict[] {
	const conflicts: TimeConflict[] = [];

	// Get all sections from all entries
	const allSections: Array<{
		section: Section;
		course: string;
		type: 'lecture' | 'lab';
	}> = [];

	entries.forEach((entry) => {
		if (entry.selectedLecture) {
			allSections.push({
				section: entry.selectedLecture,
				course: entry.courseCatalogNumber,
				type: 'lecture'
			});
		}
		if (entry.selectedLab) {
			allSections.push({
				section: entry.selectedLab,
				course: entry.courseCatalogNumber,
				type: 'lab'
			});
		}
	});

	// Check all pairs for conflicts
	for (let i = 0; i < allSections.length; i++) {
		for (let j = i + 1; j < allSections.length; j++) {
			const { conflicts: hasConflict, days } = sectionsConflict(
				allSections[i].section,
				allSections[j].section
			);

			if (hasConflict) {
				days.forEach((day) => {
					conflicts.push({
						section1: allSections[i].section,
						section2: allSections[j].section,
						course1: allSections[i].course,
						course2: allSections[j].course,
						day
					});
				});
			}
		}
	}

	return conflicts;
}

/**
 * Check if a section can be added to current schedule without conflicts
 * @param section Section to check
 * @param currentEntries Current schedule entries
 * @returns Object with canAdd flag and array of conflicts
 */
export function canAddSection(
	section: Section,
	currentEntries: ScheduleEntry[]
): { canAdd: boolean; conflicts: TimeConflict[] } {
	const allSections: Section[] = [];

	currentEntries.forEach((entry) => {
		if (entry.selectedLecture) allSections.push(entry.selectedLecture);
		if (entry.selectedLab) allSections.push(entry.selectedLab);
	});

	const conflicts: TimeConflict[] = [];

	for (const existingSection of allSections) {
		const { conflicts: hasConflict, days } = sectionsConflict(section, existingSection);

		if (hasConflict) {
			days.forEach((day) => {
				conflicts.push({
					section1: section,
					section2: existingSection,
					course1: 'New',
					course2: 'Existing',
					day
				});
			});
		}
	}

	return {
		canAdd: conflicts.length === 0,
		conflicts
	};
}

/**
 * Find first non-conflicting section from a list
 * @param sections Array of sections to check
 * @param currentEntries Current schedule entries
 * @returns First non-conflicting section or null
 */
export function findFirstNonConflictingSection(
	sections: Section[],
	currentEntries: ScheduleEntry[]
): Section | null {
	for (const section of sections) {
		const { canAdd } = canAddSection(section, currentEntries);
		if (canAdd) {
			return section;
		}
	}
	return null;
}

/**
 * Generate a distinct color for a course
 * @param index Index of the course
 * @returns Hex color code
 */
export function generateCourseColor(index: number): string {
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

	return colors[index % colors.length];
}
