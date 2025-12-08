import { browser } from '$app/environment';
import type { Course } from './catalog';
import type { SchedulerState, SchedulerPreferences } from './scheduler.types';

const STORAGE_KEY = 'selectedCourses';
const SCHEDULER_STORAGE_KEY = 'schedulerState';
const PREFERENCES_STORAGE_KEY = 'schedulerPreferences';

let selectedCourses = $state<Course[]>([]);

// Scheduler state for managing multiple schedules
let schedulerState = $state<SchedulerState>({
	schedules: [],
	activeScheduleId: null
});

// Scheduler preferences for auto-scheduling
let schedulerPreferences = $state<SchedulerPreferences>({
	minimizeGaps: true,
	avoidEarlyMorning: true,
	maximizeFreeDays: false,
	preferredInstructors: [],
	preferredInstructorsEnabled: false
});

if (browser) {
	// Load selectedCourses from localStorage
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			const parsed = JSON.parse(stored) as Course[];
			selectedCourses.length = 0;
			selectedCourses.push(...parsed);
		} catch (e) {
			console.error('Could not parse selectedCourses from localStorage:', e);
		}
	}

	// Load scheduler state from localStorage
	const storedSchedulerState = window.localStorage.getItem(SCHEDULER_STORAGE_KEY);
	if (storedSchedulerState) {
		try {
			const parsed = JSON.parse(storedSchedulerState) as SchedulerState;
			schedulerState.schedules = parsed.schedules;
			schedulerState.activeScheduleId = parsed.activeScheduleId;
		} catch (e) {
			console.error('Could not parse scheduler state from localStorage:', e);
		}
	}

	// Load preferences from localStorage
	const storedPreferences = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
	if (storedPreferences) {
		try {
			const parsed = JSON.parse(storedPreferences) as SchedulerPreferences;
			Object.assign(schedulerPreferences, parsed);
		} catch (e) {
			console.error('Could not parse preferences from localStorage:', e);
		}
	}

	// Persist changes to localStorage
	$effect.root(() => {
		$effect(() => {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCourses));
		});

		$effect(() => {
			window.localStorage.setItem(SCHEDULER_STORAGE_KEY, JSON.stringify(schedulerState));
		});

		$effect(() => {
			window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(schedulerPreferences));
		});
	});
}

export { selectedCourses, schedulerState, schedulerPreferences };