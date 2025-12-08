<script lang="ts">
	import type { Course } from '$lib/catalog';
	import type { Schedule, ScheduleEntry } from '$lib/scheduler.types';
	import { selectedCourses } from '$lib/state.svelte';
	import {
		findFirstNonConflictingSection,
		generateCourseColor,
		findScheduleConflicts,
		canAddSection
	} from '$lib/utils/scheduler';
	import WeeklyTimeGrid from './WeeklyTimeGrid.svelte';
	import CourseScheduleCard from './CourseScheduleCard.svelte';
	import AddCourseDialog from './AddCourseDialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { nanoid } from 'nanoid';

	interface Props {
		schedule: Schedule;
		onUpdate: (schedule: Schedule) => void;
	}

	let { schedule, onUpdate }: Props = $props();

	let addDialogOpen = $state(false);

	// Find courses that are not yet in the schedule
	const availableCourses = $derived(() => {
		const scheduledCourseIds = new Set(schedule.entries.map((e) => e.courseId));
		return selectedCourses.filter((c) => !scheduledCourseIds.has(c.id));
	});

	// Get full course data for each entry
	const coursesById = $derived(() => {
		const map = new Map<string, Course>();
		selectedCourses.forEach((course) => {
			map.set(course.id, course);
		});
		return map;
	});

	// Find conflicts
	const conflicts = $derived(findScheduleConflicts(schedule.entries));
	const conflictingCourseIds = $derived(() => {
		const ids = new Set<string>();
		conflicts.forEach((conflict) => {
			const entry1 = schedule.entries.find((e) =>
				[e.selectedLecture?.id, e.selectedLab?.id].includes(conflict.section1.id)
			);
			const entry2 = schedule.entries.find((e) =>
				[e.selectedLecture?.id, e.selectedLab?.id].includes(conflict.section2.id)
			);
			if (entry1) ids.add(entry1.courseId);
			if (entry2) ids.add(entry2.courseId);
		});
		return ids;
	});

	// Add course to schedule
	function addCourse(course: Course) {
		// Auto-select first non-conflicting sections
		const lecture = findFirstNonConflictingSection(course.sections.lecture, schedule.entries);
		const lab =
			course.sections.lab && course.sections.lab.length > 0
				? findFirstNonConflictingSection(course.sections.lab, [
						...schedule.entries,
						...(lecture
							? [
									{
										courseId: course.id,
										courseCatalogNumber: course.catalogNumber,
										courseDepartment: course.department,
										courseTitle: course.title,
										selectedLecture: lecture,
										selectedLab: null,
										color: ''
									} as ScheduleEntry
								]
							: [])
					])
				: null;

		if (!lecture) {
			alert(`Cannot add ${course.catalogNumber}: No non-conflicting lecture sections available.`);
			return;
		}

		const newEntry: ScheduleEntry = {
			courseId: course.id,
			courseCatalogNumber: course.catalogNumber,
			courseDepartment: course.department,
			courseTitle: course.title,
			selectedLecture: lecture,
			selectedLab: lab,
			color: generateCourseColor(schedule.entries.length)
		};

		const updatedSchedule = {
			...schedule,
			entries: [...schedule.entries, newEntry],
			updatedAt: Date.now()
		};

		onUpdate(updatedSchedule);
		addDialogOpen = false;
	}

	// Remove course from schedule
	function removeCourse(courseId: string) {
		const updatedSchedule = {
			...schedule,
			entries: schedule.entries.filter((e) => e.courseId !== courseId),
			updatedAt: Date.now()
		};
		onUpdate(updatedSchedule);
	}

	// Update lecture section
	function updateLecture(courseId: string, section: any) {
		const entryIndex = schedule.entries.findIndex((e) => e.courseId === courseId);
		if (entryIndex === -1) return;

		const otherEntries = schedule.entries.filter((e) => e.courseId !== courseId);
		const { canAdd, conflicts: sectionConflicts } = canAddSection(section, otherEntries);

		if (!canAdd) {
			alert(
				`Cannot select this section: It conflicts with ${sectionConflicts[0].course2} on ${sectionConflicts[0].day}`
			);
			return;
		}

		const updatedEntries = [...schedule.entries];
		updatedEntries[entryIndex] = {
			...updatedEntries[entryIndex],
			selectedLecture: section
		};

		onUpdate({
			...schedule,
			entries: updatedEntries,
			updatedAt: Date.now()
		});
	}

	// Update lab section
	function updateLab(courseId: string, section: any) {
		const entryIndex = schedule.entries.findIndex((e) => e.courseId === courseId);
		if (entryIndex === -1) return;

		const otherEntries = schedule.entries.filter((e) => e.courseId !== courseId);
		const currentEntry = schedule.entries[entryIndex];

		// Also check against the current lecture
		const entriesToCheck = currentEntry.selectedLecture
			? [
					...otherEntries,
					{
						...currentEntry,
						selectedLab: null
					} as ScheduleEntry
				]
			: otherEntries;

		const { canAdd, conflicts: sectionConflicts } = canAddSection(section, entriesToCheck);

		if (!canAdd) {
			alert(
				`Cannot select this section: It conflicts with ${sectionConflicts[0].course2} on ${sectionConflicts[0].day}`
			);
			return;
		}

		const updatedEntries = [...schedule.entries];
		updatedEntries[entryIndex] = {
			...updatedEntries[entryIndex],
			selectedLab: section
		};

		onUpdate({
			...schedule,
			entries: updatedEntries,
			updatedAt: Date.now()
		});
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
	<!-- Time grid -->
	<div class="min-w-0">
		<h2 class="text-lg font-semibold mb-3">Weekly Schedule</h2>
		{#if schedule.entries.length === 0}
			<div class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
				<p class="text-lg">No courses in schedule</p>
				<p class="text-sm mt-1">Add courses to see your schedule visualization</p>
			</div>
		{:else}
			<WeeklyTimeGrid entries={schedule.entries} />
		{/if}
	</div>

	<!-- Course management panel -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold">Courses ({schedule.entries.length})</h2>
			<Button size="sm" onclick={() => (addDialogOpen = true)} disabled={availableCourses().length === 0}>
				<PlusIcon class="h-4 w-4 mr-1" />
				Add Course
			</Button>
		</div>

		{#if conflicts.length > 0}
			<div
				class="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
			>
				<p class="font-semibold">⚠️ Schedule Conflicts Detected</p>
				<p class="text-xs mt-1">{conflicts.length} time conflict(s) in your schedule</p>
			</div>
		{/if}

		{#if schedule.entries.length === 0}
			<div class="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
				<p>No courses added yet</p>
				<p class="text-sm mt-1">Click "Add Course" to get started</p>
				{#if selectedCourses.length === 0}
					<p class="text-xs mt-2">
						Go to <a href="/" class="text-primary hover:underline">Catalog</a> to select courses first
					</p>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each schedule.entries as entry (entry.courseId)}
					{@const course = coursesById().get(entry.courseId)}
					{#if course}
						<CourseScheduleCard
							{entry}
							{course}
							onLectureChange={(section) => updateLecture(entry.courseId, section)}
							onLabChange={(section) => updateLab(entry.courseId, section)}
							onRemove={() => removeCourse(entry.courseId)}
							hasConflict={conflictingCourseIds().has(entry.courseId)}
						/>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<AddCourseDialog
	availableCourses={availableCourses()}
	onAdd={addCourse}
	open={addDialogOpen}
	onOpenChange={(open) => (addDialogOpen = open)}
/>
