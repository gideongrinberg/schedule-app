<script lang="ts">
	import type { SchedulerPreferences } from '$lib/scheduler.types';
	import { schedulerPreferences as globalPreferences, schedulerState } from '$lib/state.svelte';
	import * as Checkbox from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';
	import Catalog from '$lib/catalog';

	interface Props {
		preferences: SchedulerPreferences;
		onChange: (prefs: SchedulerPreferences) => void;
	}

	let { preferences, onChange }: Props = $props();

	// Get all unique instructors from the active schedule's selected courses
	const allInstructors = $derived(() => {
		const instructorSet = new Set<string>();

		// Get the active schedule
		const activeSchedule = schedulerState.schedules.find(
			(s) => s.id === schedulerState.activeScheduleId
		);

		if (!activeSchedule) return [];

		// Get all instructors from all entries in the schedule
		activeSchedule.entries.forEach((entry) => {
			if (entry.selectedLecture?.instructor) {
				entry.selectedLecture.instructor.forEach((inst) => {
					if (inst && inst.trim()) instructorSet.add(inst);
				});
			}
			if (entry.selectedLab?.instructor) {
				entry.selectedLab.instructor.forEach((inst) => {
					if (inst && inst.trim()) instructorSet.add(inst);
				});
			}
		});

		return Array.from(instructorSet).sort();
	});

	function updatePreference(key: keyof SchedulerPreferences, value: any) {
		onChange({
			...preferences,
			[key]: value
		});
	}

	function toggleInstructor(instructor: string) {
		const current = preferences.preferredInstructors;
		const updated = current.includes(instructor)
			? current.filter((i) => i !== instructor)
			: [...current, instructor];

		updatePreference('preferredInstructors', updated);
	}
</script>

<div class="space-y-6 rounded-lg border bg-card p-6">
	<div>
		<h3 class="mb-2 text-lg font-semibold">Schedule Preferences</h3>
		<p class="text-sm text-muted-foreground">
			Configure your preferences to generate optimized schedules
		</p>
	</div>

	<div class="space-y-4">
		<!-- Minimize gaps -->
		<div class="flex items-start space-x-3">
			<Checkbox.Root
				checked={preferences.minimizeGaps}
				onCheckedChange={(checked) => updatePreference('minimizeGaps', checked)}
				id="minimize-gaps"
			/>
			<div class="grid gap-1.5 leading-none">
				<Label
					for="minimize-gaps"
					class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Minimize gaps between classes
				</Label>
				<p class="text-xs text-muted-foreground">
					Prefer back-to-back classes with fewer breaks
				</p>
			</div>
		</div>

		<!-- Avoid early morning -->
		<div class="flex items-start space-x-3">
			<Checkbox.Root
				checked={preferences.avoidEarlyMorning}
				onCheckedChange={(checked) => updatePreference('avoidEarlyMorning', checked)}
				id="avoid-early"
			/>
			<div class="grid gap-1.5 leading-none">
				<Label
					for="avoid-early"
					class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Avoid early morning classes
				</Label>
				<p class="text-xs text-muted-foreground">Prefer classes starting after 9:00 AM</p>
			</div>
		</div>

		<!-- Maximize free days -->
		<div class="flex items-start space-x-3">
			<Checkbox.Root
				checked={preferences.maximizeFreeDays}
				onCheckedChange={(checked) => updatePreference('maximizeFreeDays', checked)}
				id="maximize-free-days"
			/>
			<div class="grid gap-1.5 leading-none">
				<Label
					for="maximize-free-days"
					class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Maximize free days
				</Label>
				<p class="text-xs text-muted-foreground">Group classes on fewer days per week</p>
			</div>
		</div>

		<!-- Preferred instructors -->
		<div class="space-y-3">
			<div class="flex items-start space-x-3">
				<Checkbox.Root
					checked={preferences.preferredInstructorsEnabled}
					onCheckedChange={(checked) =>
						updatePreference('preferredInstructorsEnabled', checked)}
					id="prefer-instructors"
				/>
				<div class="grid gap-1.5 leading-none">
					<Label
						for="prefer-instructors"
						class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Prefer certain instructors
					</Label>
					<p class="text-xs text-muted-foreground">
						Prioritize sections taught by selected instructors
					</p>
				</div>
			</div>

			{#if preferences.preferredInstructorsEnabled}
				<div class="ml-7 space-y-2 rounded-md border bg-muted/50 p-3">
					{#if allInstructors().length === 0}
						<p class="text-xs text-muted-foreground">
							Add courses to your schedule to select instructors
						</p>
					{:else}
						<p class="mb-2 text-xs font-medium">Select preferred instructors:</p>
						<div class="max-h-48 space-y-2 overflow-y-auto">
							{#each allInstructors() as instructor (instructor)}
								<div class="flex items-center space-x-2">
									<Checkbox.Root
										checked={preferences.preferredInstructors.includes(
											instructor
										)}
										onCheckedChange={() => toggleInstructor(instructor)}
										id="instructor-{instructor}"
									/>
									<Label
										for="instructor-{instructor}"
										class="cursor-pointer text-xs font-normal"
									>
										{instructor}
									</Label>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
