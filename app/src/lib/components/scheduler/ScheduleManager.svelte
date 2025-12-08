<script lang="ts">
	import type { Schedule } from '$lib/scheduler.types';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CheckIcon from '@lucide/svelte/icons/check';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { nanoid } from 'nanoid';

	interface Props {
		schedules: Schedule[];
		activeScheduleId: string | null;
		onCreate: (name: string) => void;
		onRename: (id: string, name: string) => void;
		onDelete: (id: string) => void;
		onSwitch: (id: string) => void;
	}

	let { schedules, activeScheduleId, onCreate, onRename, onDelete, onSwitch }: Props = $props();

	let createDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let scheduleToDelete = $state<string | null>(null);
	let editingScheduleId = $state<string | null>(null);
	let newScheduleName = $state('');
	let editScheduleName = $state('');

	function handleCreate() {
		if (newScheduleName.trim()) {
			onCreate(newScheduleName.trim());
			newScheduleName = '';
			createDialogOpen = false;
		}
	}

	function startEdit(schedule: Schedule) {
		editingScheduleId = schedule.id;
		editScheduleName = schedule.name;
	}

	function saveEdit() {
		if (editingScheduleId && editScheduleName.trim()) {
			onRename(editingScheduleId, editScheduleName.trim());
			editingScheduleId = null;
			editScheduleName = '';
		}
	}

	function cancelEdit() {
		editingScheduleId = null;
		editScheduleName = '';
	}

	function confirmDelete(id: string) {
		scheduleToDelete = id;
		deleteDialogOpen = true;
	}

	function handleDelete() {
		if (scheduleToDelete) {
			onDelete(scheduleToDelete);
			scheduleToDelete = null;
			deleteDialogOpen = false;
		}
	}

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">Your Schedules</h2>
		<Button size="sm" onclick={() => (createDialogOpen = true)}>
			<PlusIcon class="h-4 w-4 mr-1" />
			New Schedule
		</Button>
	</div>

	{#if schedules.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
			<p class="text-lg">No schedules yet</p>
			<p class="text-sm mt-1">Create your first schedule to get started</p>
			<Button class="mt-4" onclick={() => (createDialogOpen = true)}>
				<PlusIcon class="h-4 w-4 mr-1" />
				Create Schedule
			</Button>
		</div>
	{:else}
		<div class="space-y-2">
			{#each schedules as schedule (schedule.id)}
				{@const isActive = schedule.id === activeScheduleId}
				<div
					class="rounded-lg border p-4 transition-colors {isActive
						? 'border-primary bg-primary/5'
						: 'hover:bg-accent'}"
				>
					<div class="flex items-start justify-between gap-3">
						<!-- Schedule info -->
						<div class="flex-1 min-w-0">
							{#if editingScheduleId === schedule.id}
								<input
									type="text"
									bind:value={editScheduleName}
									class="w-full rounded border border-input bg-background px-2 py-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveEdit();
										if (e.key === 'Escape') cancelEdit();
									}}
								/>
							{:else}
								<div class="flex items-center gap-2">
									<h3 class="font-semibold truncate">{schedule.name}</h3>
									{#if isActive}
										<span
											class="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
										>
											Active
										</span>
									{/if}
								</div>
							{/if}
							<div class="text-xs text-muted-foreground mt-1">
								<span>{schedule.entries.length} course{schedule.entries.length !== 1 ? 's' : ''}</span>
								<span class="mx-1">•</span>
								<span>Updated {formatDate(schedule.updatedAt)}</span>
							</div>
						</div>

						<!-- Actions -->
						<div class="flex items-center gap-1">
							{#if editingScheduleId === schedule.id}
								<Button size="sm" variant="ghost" onclick={saveEdit}>
									<CheckIcon class="h-4 w-4" />
								</Button>
								<Button size="sm" variant="ghost" onclick={cancelEdit}>
									<span class="text-xs">Cancel</span>
								</Button>
							{:else}
								{#if !isActive}
									<Button size="sm" variant="outline" onclick={() => onSwitch(schedule.id)}>
										Switch
									</Button>
								{/if}
								<Button size="sm" variant="ghost" onclick={() => startEdit(schedule)}>
									<PencilIcon class="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => confirmDelete(schedule.id)}
									disabled={schedules.length === 1}
								>
									<Trash2Icon class="h-4 w-4 text-destructive" />
								</Button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create schedule dialog -->
<Dialog.Root open={createDialogOpen} onOpenChange={(open) => (createDialogOpen = open)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create New Schedule</Dialog.Title>
			<Dialog.Description>Give your schedule a name to get started.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="schedule-name" class="text-sm font-medium">Schedule Name</label>
				<input
					id="schedule-name"
					type="text"
					placeholder="e.g., Fall 2024 Plan A"
					bind:value={newScheduleName}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					onkeydown={(e) => {
						if (e.key === 'Enter') handleCreate();
					}}
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (createDialogOpen = false)}>Cancel</Button>
			<Button onclick={handleCreate} disabled={!newScheduleName.trim()}>Create</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete confirmation dialog -->
<Dialog.Root open={deleteDialogOpen} onOpenChange={(open) => (deleteDialogOpen = open)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Schedule</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this schedule? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={handleDelete}>Delete</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
