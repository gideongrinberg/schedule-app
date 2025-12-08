<script lang="ts">
	import type { Course } from '$lib/catalog';
	import type { Schedule, SchedulerPreferences, GeneratedSchedule } from '$lib/scheduler.types';
	import { selectedCourses, schedulerPreferences } from '$lib/state.svelte';
	import { generateSchedules } from '$lib/utils/auto-scheduler';
	import PreferencesPanel from './PreferencesPanel.svelte';
	import ScheduleOptionCard from './ScheduleOptionCard.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import InfoIcon from '@lucide/svelte/icons/info';

	interface Props {
		schedule: Schedule;
		onApply: (schedule: Schedule) => void;
	}

	let { schedule, onApply }: Props = $props();

	let generatedSchedules = $state<GeneratedSchedule[]>([]);
	let isGenerating = $state(false);
	let hasGenerated = $state(false);
	let error = $state<string | null>(null);
	let generationTime = $state<number>(0);

	// Get courses that are in selectedCourses (used for generation)
	const coursesToSchedule = $derived(() => {
		return selectedCourses;
	});

	// Use global preferences
	let localPreferences = $state<SchedulerPreferences>({ ...schedulerPreferences });

	function handlePreferenceChange(prefs: SchedulerPreferences) {
		localPreferences = prefs;
		// Also update global preferences
		Object.assign(schedulerPreferences, prefs);
	}

	async function generateScheduleOptions() {
		if (coursesToSchedule().length === 0) {
			error = 'Please select courses from the catalog first.';
			return;
		}

		isGenerating = true;
		error = null;
		generatedSchedules = [];

		// Use setTimeout to allow UI to update
		setTimeout(() => {
			try {
				const startTime = performance.now();
				const options = generateSchedules(coursesToSchedule(), localPreferences, 50);
				const endTime = performance.now();

				generationTime = Math.round(endTime - startTime);
				generatedSchedules = options;
				hasGenerated = true;

				if (options.length === 0) {
					error =
						'No valid schedules found. Try removing some courses or adjusting your preferences.';
				}
			} catch (e) {
				console.error('Error generating schedules:', e);
				error = 'An error occurred while generating schedules. Please try again.';
			} finally {
				isGenerating = false;
			}
		}, 100);
	}

	function applySchedule(option: GeneratedSchedule) {
		// Create a new schedule with the generated entries
		const updatedSchedule: Schedule = {
			...schedule,
			entries: option.entries,
			updatedAt: Date.now()
		};

		onApply(updatedSchedule);
	}
</script>

<div class="space-y-6">
	<!-- Instructions -->
	<div class="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
		<div class="flex gap-3">
			<InfoIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
			<div class="flex-1 text-sm">
				<p class="mb-1 font-medium text-blue-900 dark:text-blue-100">
					How Auto-Scheduling Works
				</p>
				<ul class="space-y-1 text-xs text-blue-800 dark:text-blue-200">
					<li>
						• Configure your preferences below to customize how schedules are generated
						and ranked
					</li>
					<li>
						• Click "Generate Schedules" to create up to 50 optimized schedule options
					</li>
					<li>
						• Review the options and click "Apply" on your preferred schedule to load it
						into the active schedule
					</li>
					<li>• You can then switch to Manual mode to make further adjustments</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
		<!-- Left: Preferences -->
		<div class="space-y-4">
			<PreferencesPanel preferences={localPreferences} onChange={handlePreferenceChange} />

			<Button
				class="w-full"
				size="lg"
				onclick={generateScheduleOptions}
				disabled={isGenerating || coursesToSchedule().length === 0}
			>
				{#if isGenerating}
					<span class="mr-2 animate-spin">⏳</span>
					Generating...
				{:else}
					<SparklesIcon class="mr-2 h-4 w-4" />
					Generate Schedules
				{/if}
			</Button>

			{#if coursesToSchedule().length === 0}
				<p class="text-center text-xs text-muted-foreground">
					Select courses from the catalog to enable generation
				</p>
			{/if}
		</div>

		<!-- Right: Results -->
		<div class="min-w-0">
			{#if !hasGenerated}
				<div class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
					<SparklesIcon class="mx-auto mb-3 h-12 w-12 opacity-50" />
					<p class="text-lg font-medium">Ready to Generate Schedules</p>
					<p class="mt-2 text-sm">
						Configure your preferences and click "Generate Schedules" to see options
					</p>
				</div>
			{:else if isGenerating}
				<div class="rounded-lg border p-12 text-center">
					<div class="mb-3 animate-spin text-4xl">⏳</div>
					<p class="text-lg font-medium">Generating Schedules...</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Analyzing {coursesToSchedule().length} course(s) and finding optimal combinations
					</p>
				</div>
			{:else if error}
				<div class="rounded-lg border border-destructive bg-destructive/10 p-6">
					<div class="flex items-start gap-3">
						<AlertCircleIcon class="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
						<div>
							<p class="font-medium text-destructive">Generation Failed</p>
							<p class="mt-1 text-sm text-destructive/80">{error}</p>
						</div>
					</div>
				</div>
			{:else if generatedSchedules.length > 0}
				<div class="space-y-4">
					<!-- Results header -->
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold">
								Generated Schedules ({generatedSchedules.length})
							</h3>
							<p class="text-xs text-muted-foreground">
								Completed in {generationTime}ms • Sorted by score
							</p>
						</div>
						<Button variant="outline" size="sm" onclick={generateScheduleOptions}>
							Regenerate
						</Button>
					</div>

					<!-- Schedule options -->
					<div class="space-y-4">
						{#each generatedSchedules as option, index (option.id)}
							<ScheduleOptionCard
								{option}
								rank={index + 1}
								onSelect={() => applySchedule(option)}
							/>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
