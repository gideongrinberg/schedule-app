<script lang="ts">
	import type { ScheduleEntry } from '$lib/scheduler.types';
	import { formatTime } from '$lib/utils/time-formatting';
	import CourseBlock from './CourseBlock.svelte';

	interface Props {
		entries: ScheduleEntry[];
		compact?: boolean;
	}

	let { entries, compact = false }: Props = $props();

	const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
	const START_HOUR = 8; // 8 AM
	const END_HOUR = 20; // 8 PM
	const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

	// Organize sections by day
	const sectionsByDay = $derived(() => {
		const byDay: Record<string, Array<{ entry: ScheduleEntry; start: number; end: number }>> = {
			Mon: [],
			Tue: [],
			Wed: [],
			Thu: [],
			Fri: []
		};

		entries.forEach((entry) => {
			// Process lecture sections
			if (entry.selectedLecture && entry.selectedLecture.time && entry.selectedLecture.days) {
				const [start, end] = entry.selectedLecture.time;
				entry.selectedLecture.days.forEach((day) => {
					if (byDay[day]) {
						byDay[day].push({ entry, start, end });
					}
				});
			}

			// Process lab sections
			if (entry.selectedLab && entry.selectedLab.time && entry.selectedLab.days) {
				const [start, end] = entry.selectedLab.time;
				entry.selectedLab.days.forEach((day) => {
					if (byDay[day]) {
						byDay[day].push({ entry, start, end });
					}
				});
			}
		});

		return byDay;
	});
</script>

<div class="rounded-lg border bg-card shadow-sm {compact ? 'text-xs' : ''}">
	<!-- Header with days -->
	<div class="grid grid-cols-[60px_repeat(5,1fr)] border-b bg-muted/50">
		<div class="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
		{#each DAYS as day}
			<div class="border-l p-2 text-center text-sm font-semibold">{day}</div>
		{/each}
	</div>

	<!-- Time grid -->
	<div class="relative grid grid-cols-[60px_repeat(5,1fr)]">
		<!-- Time labels column -->
		<div class="border-r bg-muted/30">
			{#each HOURS as hour}
				<div
					class="flex items-start justify-end border-b px-2 py-1 text-xs text-muted-foreground"
					style="height: {compact ? '40px' : '60px'}"
				>
					{formatTime(hour * 60)}
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		{#each DAYS as day}
			<div class="relative border-l">
				<!-- Hour dividers -->
				{#each HOURS as hour}
					<div
						class="border-b {hour % 2 === 0 ? 'bg-background' : 'bg-muted/10'}"
						style="height: {compact ? '40px' : '60px'}"
					></div>
				{/each}

				<!-- Course blocks (absolute positioned) -->
				<div class="absolute inset-0 px-1">
					{#each sectionsByDay()[day] || [] as { entry, start, end } (entry.courseId + start + end)}
						<CourseBlock {entry} startTime={start} endTime={end} {day} {compact} />
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
