<script lang="ts">
	import type { Course } from '$lib/catalog';
	import type { ScheduleEntry } from '$lib/scheduler.types';
	import SectionSelector from './SectionSelector.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils';

	interface Props {
		entry: ScheduleEntry;
		course: Course;
		onLectureChange: (section: any) => void;
		onLabChange: (section: any) => void;
		onRemove: () => void;
		conflictingSectionIds?: string[];
		hasConflict?: boolean;
	}

	let {
		entry,
		course,
		onLectureChange,
		onLabChange,
		onRemove,
		conflictingSectionIds = [],
		hasConflict = false
	}: Props = $props();
</script>

<div
	class={cn(
		'rounded-lg border bg-card p-4 shadow-sm',
		hasConflict && 'border-destructive bg-destructive/5'
	)}
>
	<!-- Course header -->
	<div class="mb-3 flex items-start justify-between gap-2">
		<div class="flex-1">
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded-full" style="background-color: {entry.color}"></div>
				<h3 class="font-semibold">{entry.courseCatalogNumber}</h3>
			</div>
			<p class="text-sm text-muted-foreground">{entry.courseTitle}</p>
			{#if course.units}
				<p class="text-xs text-muted-foreground">{course.units} units</p>
			{/if}
		</div>
		<Button variant="ghost" size="icon" onclick={onRemove} class="h-8 w-8">
			<XIcon class="h-4 w-4" />
		</Button>
	</div>

	{#if hasConflict}
		<div
			class="mb-3 rounded border border-destructive bg-destructive/10 p-2 text-xs text-destructive"
		>
			⚠️ This course has a time conflict with another course in your schedule
		</div>
	{/if}

	<!-- Section selectors -->
	<div class="space-y-3">
		<!-- Lecture section -->
		{#if course.sections.lecture.length > 0}
			<SectionSelector
				sections={course.sections.lecture}
				selectedSection={entry.selectedLecture}
				onSelect={onLectureChange}
				conflictingSections={conflictingSectionIds}
				label="Lecture Section"
			/>
		{/if}

		<!-- Lab section (if applicable) -->
		{#if course.sections.lab && course.sections.lab.length > 0}
			<SectionSelector
				sections={course.sections.lab}
				selectedSection={entry.selectedLab}
				onSelect={onLabChange}
				conflictingSections={conflictingSectionIds}
				label="Lab Section"
			/>
		{/if}
	</div>
</div>
