<script lang="ts">
	import type { Course } from '$lib/catalog';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	interface Props {
		availableCourses: Course[];
		onAdd: (course: Course) => void;
		open: boolean;
		onOpenChange: (open: boolean) => void;
	}

	let { availableCourses, onAdd, open, onOpenChange }: Props = $props();

	let searchQuery = $state('');

	const filteredCourses = $derived(() => {
		if (!searchQuery.trim()) return availableCourses;

		const query = searchQuery.toLowerCase();
		return availableCourses.filter(
			(course) =>
				course.title.toLowerCase().includes(query) ||
				course.catalogNumber.toLowerCase().includes(query) ||
				course.department.toLowerCase().includes(query)
		);
	});

	function handleAdd(course: Course) {
		onAdd(course);
		searchQuery = ''; // Reset search
	}
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
	<Dialog.Content class="max-w-2xl max-h-[80vh] flex flex-col">
		<Dialog.Header>
			<Dialog.Title>Add Course to Schedule</Dialog.Title>
			<Dialog.Description>
				Select a course from your selected courses to add to this schedule.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Search input -->
		<div class="mb-4">
			<input
				type="text"
				placeholder="Search courses..."
				bind:value={searchQuery}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			/>
		</div>

		<!-- Course list -->
		<div class="flex-1 overflow-y-auto space-y-2">
			{#if filteredCourses().length === 0}
				<div class="py-8 text-center text-muted-foreground">
					{#if availableCourses.length === 0}
						<p>All courses from your selection are already in this schedule.</p>
						<p class="text-sm mt-2">Go to the Catalog page to add more courses.</p>
					{:else}
						<p>No courses match your search.</p>
					{/if}
				</div>
			{:else}
				{#each filteredCourses() as course, index (course.id || `${course.catalogNumber}-${course.department}-${index}`)}
					<div
						class="flex items-start justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent"
					>
						<div class="flex-1 min-w-0">
							<h4 class="font-medium">{course.catalogNumber}</h4>
							<p class="text-sm text-muted-foreground truncate">{course.title}</p>
							<div class="flex gap-2 mt-1 text-xs text-muted-foreground">
								<span>{course.school}</span>
								{#if course.units}
									<span>•</span>
									<span>{course.units} units</span>
								{/if}
								<span>•</span>
								<span
									>{course.sections.lecture.length} lecture{course.sections.lecture.length !== 1
										? 's'
										: ''}</span
								>
								{#if course.sections.lab}
									<span>•</span>
									<span
										>{course.sections.lab.length} lab{course.sections.lab.length !== 1
											? 's'
											: ''}</span
									>
								{/if}
							</div>
						</div>
						<Button size="sm" onclick={() => handleAdd(course)}>
							<PlusIcon class="h-4 w-4 mr-1" />
							Add
						</Button>
					</div>
				{/each}
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
