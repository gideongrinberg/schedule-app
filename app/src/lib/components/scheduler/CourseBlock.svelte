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
	class="absolute left-0 right-0 rounded p-1 text-xs text-white shadow-sm transition-all hover:shadow-md hover:z-10"
	style="top: {topPercent}%; height: {heightPercent}%; background-color: {entry.color}; opacity: 0.9;"
	title="{entry.courseCatalogNumber}: {entry.courseTitle}\n{formatTime(startTime)} - {formatTime(
		endTime
	)}"
>
	{#if !compact}
		<div class="font-semibold truncate">{entry.courseCatalogNumber}</div>
		<div class="text-[10px] truncate opacity-90">{formatTime(startTime)}</div>
	{:else}
		<div class="text-[10px] font-medium truncate">{entry.courseCatalogNumber}</div>
	{/if}
</div>
