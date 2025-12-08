<script lang="ts">
	import type { GeneratedSchedule } from '$lib/scheduler.types';
	import WeeklyTimeGrid from './WeeklyTimeGrid.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { formatDuration } from '$lib/utils/time-formatting';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		option: GeneratedSchedule;
		onSelect: () => void;
		rank: number;
	}

	let { option, onSelect, rank }: Props = $props();

	// Determine score color
	const scoreColor = $derived(() => {
		if (option.score >= 80) return 'text-green-600';
		if (option.score >= 60) return 'text-blue-600';
		if (option.score >= 40) return 'text-yellow-600';
		return 'text-orange-600';
	});

	// Determine score label
	const scoreLabel = $derived(() => {
		if (option.score >= 80) return 'Excellent';
		if (option.score >= 60) return 'Good';
		if (option.score >= 40) return 'Fair';
		return 'Acceptable';
	});
</script>

<div class="overflow-hidden rounded-lg border bg-card shadow-sm">
	<!-- Header -->
	<div class="border-b bg-muted/30 px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-2xl font-bold text-muted-foreground">#{rank}</span>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold {scoreColor()}">
							{option.score.toFixed(0)}
						</span>
						<span class="text-xs font-medium text-muted-foreground uppercase">
							{scoreLabel()}
						</span>
					</div>
				</div>
			</div>
			<Button size="sm" onclick={onSelect}>
				<CheckIcon class="mr-1 h-4 w-4" />
				Apply
			</Button>
		</div>
	</div>

	<!-- Metrics -->
	<div class="grid grid-cols-2 gap-3 border-b bg-muted/10 p-4 sm:grid-cols-4">
		<div class="text-center">
			<div class="text-2xl font-bold">{option.metrics.daysPerWeek}</div>
			<div class="text-xs text-muted-foreground">Days/Week</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-bold">{formatDuration(option.metrics.totalGapMinutes)}</div>
			<div class="text-xs text-muted-foreground">Total Gaps</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-bold">{option.metrics.earlyMorningClasses}</div>
			<div class="text-xs text-muted-foreground">Early Classes</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-bold">{option.metrics.preferredInstructorMatches}</div>
			<div class="text-xs text-muted-foreground">Pref. Instructors</div>
		</div>
	</div>

	<!-- Schedule preview -->
	<div class="p-4">
		<WeeklyTimeGrid entries={option.entries} compact={true} />
	</div>

	<!-- Course list -->
	<div class="border-t bg-muted/5 p-4">
		<p class="mb-2 text-xs font-medium text-muted-foreground">
			Courses ({option.entries.length}):
		</p>
		<div class="flex flex-wrap gap-1.5">
			{#each option.entries as entry (entry.courseId)}
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-white"
					style="background-color: {entry.color}"
				>
					{entry.courseCatalogNumber}
				</span>
			{/each}
		</div>
	</div>
</div>
