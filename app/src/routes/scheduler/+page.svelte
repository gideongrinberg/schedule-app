<script lang="ts">
	import type { Schedule } from '$lib/scheduler.types';
	import { schedulerState, selectedCourses } from '$lib/state.svelte';
	import ManualScheduler from '$lib/components/scheduler/ManualScheduler.svelte';
	import AutoScheduler from '$lib/components/scheduler/AutoScheduler.svelte';
	import ScheduleManager from '$lib/components/scheduler/ScheduleManager.svelte';
	import * as Select from '$lib/components/ui/select';
	import Button from '$lib/components/ui/button/button.svelte';
	import { nanoid } from 'nanoid';

	type Tab = 'manual' | 'auto' | 'manage';
	let activeTab = $state<Tab>('manual');

	// Ensure there's always at least one schedule
	$effect(() => {
		if (schedulerState.schedules.length === 0) {
			// Create default schedule
			const defaultSchedule: Schedule = {
				id: nanoid(),
				name: 'My Schedule',
				entries: [],
				createdAt: Date.now(),
				updatedAt: Date.now()
			};
			schedulerState.schedules = [defaultSchedule];
			schedulerState.activeScheduleId = defaultSchedule.id;
		} else if (!schedulerState.activeScheduleId) {
			// Set first schedule as active if none is active
			schedulerState.activeScheduleId = schedulerState.schedules[0].id;
		}
	});

	// Get active schedule
	const activeSchedule = $derived(
		schedulerState.schedules.find((s) => s.id === schedulerState.activeScheduleId) ||
			schedulerState.schedules[0]
	);

	// Schedule management functions
	function createSchedule(name: string) {
		const newSchedule: Schedule = {
			id: nanoid(),
			name,
			entries: [],
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		schedulerState.schedules = [...schedulerState.schedules, newSchedule];
		schedulerState.activeScheduleId = newSchedule.id;
	}

	function renameSchedule(id: string, name: string) {
		const index = schedulerState.schedules.findIndex((s) => s.id === id);
		if (index !== -1) {
			schedulerState.schedules[index] = {
				...schedulerState.schedules[index],
				name,
				updatedAt: Date.now()
			};
			schedulerState.schedules = [...schedulerState.schedules];
		}
	}

	function deleteSchedule(id: string) {
		// Don't allow deleting the last schedule
		if (schedulerState.schedules.length === 1) return;

		schedulerState.schedules = schedulerState.schedules.filter((s) => s.id !== id);

		// If deleted schedule was active, switch to first remaining schedule
		if (schedulerState.activeScheduleId === id) {
			schedulerState.activeScheduleId = schedulerState.schedules[0].id;
		}
	}

	function switchSchedule(id: string) {
		schedulerState.activeScheduleId = id;
	}

	function updateSchedule(updatedSchedule: Schedule) {
		const index = schedulerState.schedules.findIndex((s) => s.id === updatedSchedule.id);
		if (index !== -1) {
			schedulerState.schedules[index] = updatedSchedule;
			schedulerState.schedules = [...schedulerState.schedules];
		}
	}

	// Selected schedule value for dropdown
	let selectedScheduleValue = $state(schedulerState.activeScheduleId || '');

	// Update selectedScheduleValue when activeScheduleId changes
	$effect(() => {
		selectedScheduleValue = schedulerState.activeScheduleId || '';
	});

	// Handle schedule selection change
	$effect(() => {
		if (selectedScheduleValue && selectedScheduleValue !== schedulerState.activeScheduleId) {
			switchSchedule(selectedScheduleValue);
		}
	});
</script>

<svelte:head>
	<title>Scheduler - BearSched</title>
</svelte:head>

<div class="container mx-auto max-w-screen-2xl px-4 py-6">
	<!-- Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">Schedule Builder</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Build and manage your course schedules
			</p>
		</div>

		<!-- Schedule selector -->
		{#if schedulerState.schedules.length > 0}
			<div class="w-full sm:w-64">
				<Select.Root type="single" bind:value={selectedScheduleValue}>
					<Select.Trigger class="w-full">
						{activeSchedule?.name || 'Select schedule'}
					</Select.Trigger>
					<Select.Content>
						{#each schedulerState.schedules as schedule (schedule.id)}
							<Select.Item value={schedule.id}>
								<div class="flex items-center justify-between gap-2">
									<span>{schedule.name}</span>
									{#if schedule.id === schedulerState.activeScheduleId}
										<span class="text-xs text-primary">(Active)</span>
									{/if}
								</div>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{/if}
	</div>

	<!-- Tab navigation -->
	<div class="mb-6 border-b">
		<nav class="flex gap-6" aria-label="Scheduler tabs">
			<button
				onclick={() => (activeTab = 'manual')}
				class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'manual'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Manual
			</button>
			<button
				onclick={() => (activeTab = 'auto')}
				class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'auto'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Auto-Schedule
			</button>
			<button
				onclick={() => (activeTab = 'manage')}
				class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors {activeTab === 'manage'
					? 'border-primary text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				Manage
			</button>
		</nav>
	</div>

	<!-- Tab content -->
	{#if selectedCourses.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
			<p class="text-lg">No courses selected</p>
			<p class="text-sm mt-1">Go to the Catalog page to select courses first</p>
			<Button class="mt-4" href="/">Go to Catalog</Button>
		</div>
	{:else if activeTab === 'manual'}
		{#if activeSchedule}
			<ManualScheduler schedule={activeSchedule} onUpdate={updateSchedule} />
		{/if}
	{:else if activeTab === 'auto'}
		{#if activeSchedule}
			<AutoScheduler schedule={activeSchedule} onApply={updateSchedule} />
		{/if}
	{:else if activeTab === 'manage'}
		<ScheduleManager
			schedules={schedulerState.schedules}
			activeScheduleId={schedulerState.activeScheduleId}
			onCreate={createSchedule}
			onRename={renameSchedule}
			onDelete={deleteSchedule}
			onSwitch={switchSchedule}
		/>
	{/if}
</div>
