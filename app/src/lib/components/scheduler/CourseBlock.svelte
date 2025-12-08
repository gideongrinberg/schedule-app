<script lang="ts">
	import type { ScheduleEntry } from '$lib/scheduler.types';
	import { formatTime } from '$lib/utils/time-formatting';

	interface Props {
		entry: ScheduleEntry;
		startTime: number; // Start time in minutes
		endTime: number; // End time in minutes
		day: string; // Day name (e.g., "Mon")
		compact?: boolean;
	}

	let { entry, startTime, endTime, day, compact = false }: Props = $props();

	// Calculate position and height as percentages
	const GRID_START = 480; // 8:00 AM in minutes
	const GRID_END = 1200; // 8:00 PM in minutes
	const GRID_DURATION = GRID_END - GRID_START;

	const topPercent = $derived(((startTime - GRID_START) / GRID_DURATION) * 100);
	const heightPercent = $derived(((endTime - startTime) / GRID_DURATION) * 100);
</script>

<div
	class="absolute right-0 left-0 rounded p-1 text-xs text-white shadow-sm transition-all hover:z-10 hover:shadow-md"
	style="top: {topPercent}%; height: {heightPercent}%; background-color: {entry.color}; opacity: 0.9;"
	title="{entry.courseCatalogNumber}: {entry.courseTitle}\n{formatTime(startTime)} - {formatTime(
		endTime
	)}"
>
	{#if !compact}
		<div class="truncate font-semibold">{entry.courseCatalogNumber}</div>
		<div class="truncate text-[10px] opacity-90">{formatTime(startTime)}</div>
	{:else}
		<div class="truncate text-[10px] font-medium">{entry.courseCatalogNumber}</div>
	{/if}
</div>
