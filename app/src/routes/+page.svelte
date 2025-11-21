<script lang="ts">
	import Catalog from '$lib/catalog';;
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';

	const schools = Object.keys(Catalog.meta.schools);

	let searchQuery = $state('');
	let selectedSchool = $state<string | null>(null);
	let selectedDepartment = $state<string | null>(null);
	let selectedInstructors = $state<string[]>([]);

	let schoolPopoverOpen = $state(false);
	let departmentPopoverOpen = $state(false);
	let instructorPopoverOpen = $state(false);

	let schoolTriggerRef = $state<HTMLButtonElement>(null!);
	let departmentTriggerRef = $state<HTMLButtonElement>(null!);
	let instructorTriggerRef = $state<HTMLButtonElement>(null!);

	const availableDepartments = $derived(
		selectedSchool ? Catalog.meta.schools[selectedSchool] || [] : []
	);

	const availableInstructors = $derived(() => {
		const instructorSet = new Set<string>();
		Catalog.courses.forEach((course) => {
			course.sections.forEach((section) => {
				if (section.instructor) {
					section.instructor.forEach((instructor) => {
						if (instructor) instructorSet.add(instructor);
					});
				}
			});
		});
		return Array.from(instructorSet).sort();
	});

	const filteredCourses = $derived(() => {
		let courses = Catalog.courses;
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			courses = courses.filter(
				(course) =>
					course.title.toLowerCase().includes(query) ||
					course.catalog_number.toLowerCase().includes(query)
			);
		}

		if (selectedSchool) {
			courses = courses.filter((course) => course.school === selectedSchool);
		}

		if (selectedDepartment) {
			courses = courses.filter((course) => course.department === selectedDepartment);
		}

		if (selectedInstructors.length > 0) {
			courses = courses.filter((course) =>
				course.sections.some((section) =>
					section.instructor?.some((instructor) => selectedInstructors.includes(instructor))
				)
			);
		}

		return courses;
	});

	function closeSchoolPopover() {
		schoolPopoverOpen = false;
		tick().then(() => schoolTriggerRef.focus());
	}

	function closeDepartmentPopover() {
		departmentPopoverOpen = false;
		tick().then(() => departmentTriggerRef.focus());
	}

	function closeInstructorPopover() {
		instructorPopoverOpen = false;
		tick().then(() => instructorTriggerRef.focus());
	}

	function toggleInstructor(instructor: string) {
		if (selectedInstructors.includes(instructor)) {
			selectedInstructors = selectedInstructors.filter((i) => i !== instructor);
		} else {
			selectedInstructors = [...selectedInstructors, instructor];
		}
	}

	function removeInstructor(instructor: string) {
		selectedInstructors = selectedInstructors.filter((i) => i !== instructor);
	}

	function clearSchool() {
		selectedSchool = null;
		selectedDepartment = null;
	}

	function clearDepartment() {
		selectedDepartment = null;
	}

	$effect(() => {
		if (selectedSchool && !availableDepartments.includes(selectedDepartment || '')) {
			selectedDepartment = null;
		}
	});
</script>

<div class="flex h-screen flex-col">
	<!-- Top bar with search -->
	<div class="border-b bg-background p-4">
		<div class="mx-auto max-w-7xl">
			<input
				type="text"
				placeholder="Search courses by title or catalog number..."
				bind:value={searchQuery}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			/>
		</div>
	</div>

	<!-- Main content area -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Sidebar -->
		<aside class="w-64 border-r bg-background p-4 overflow-y-auto">
			<h2 class="mb-4 text-lg font-semibold">Filters</h2>

			<!-- School Filter -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium">School</label>
				<Popover.Root bind:open={schoolPopoverOpen}>
					<Popover.Trigger bind:ref={schoolTriggerRef}>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="w-full justify-between"
								role="combobox"
								aria-expanded={schoolPopoverOpen}
							>
								<span class="truncate">
									{selectedSchool || 'Select school...'}
								</span>
								{#if selectedSchool}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											clearSchool();
										}}
										class="ml-2 rounded-sm opacity-50 hover:opacity-100"
									>
										<XIcon class="h-4 w-4" />
									</button>
								{:else}
									<ChevronsUpDownIcon class="ml-2 h-4 w-4 opacity-50" />
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[240px] p-0">
						<Command.Root>
							<Command.Input placeholder="Search school..." />
							<Command.List>
								<Command.Empty>No school found.</Command.Empty>
								<Command.Group>
									{#each schools as school (school)}
										<Command.Item
											value={school}
											onSelect={() => {
												selectedSchool = school;
												closeSchoolPopover();
											}}
										>
											<CheckIcon
												class={cn(
													'mr-2 h-4 w-4',
													selectedSchool !== school && 'text-transparent'
												)}
											/>
											{school}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Department Filter -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium">Department</label>
				<Popover.Root bind:open={departmentPopoverOpen}>
					<Popover.Trigger bind:ref={departmentTriggerRef}>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="w-full justify-between"
								role="combobox"
								aria-expanded={departmentPopoverOpen}
								disabled={!selectedSchool}
							>
								<span class="truncate">
									{selectedDepartment || 'Select department...'}
								</span>
								{#if selectedDepartment}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											clearDepartment();
										}}
										class="ml-2 rounded-sm opacity-50 hover:opacity-100"
									>
										<XIcon class="h-4 w-4" />
									</button>
								{:else}
									<ChevronsUpDownIcon class="ml-2 h-4 w-4 opacity-50" />
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[240px] p-0">
						<Command.Root>
							<Command.Input placeholder="Search department..." />
							<Command.List>
								<Command.Empty>No department found.</Command.Empty>
								<Command.Group>
									{#each availableDepartments as department (department)}
										<Command.Item
											value={department}
											onSelect={() => {
												selectedDepartment = department;
												closeDepartmentPopover();
											}}
										>
											<CheckIcon
												class={cn(
													'mr-2 h-4 w-4',
													selectedDepartment !== department && 'text-transparent'
												)}
											/>
											{department}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>

			<!-- Instructor Filter (Multi-select) -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium">Instructors</label>
				<Popover.Root bind:open={instructorPopoverOpen}>
					<Popover.Trigger bind:ref={instructorTriggerRef}>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="w-full justify-between"
								role="combobox"
								aria-expanded={instructorPopoverOpen}
							>
								<span class="truncate">
									{selectedInstructors.length > 0
										? `${selectedInstructors.length} selected`
										: 'Select instructors...'}
								</span>
								<ChevronsUpDownIcon class="ml-2 h-4 w-4 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[240px] p-0">
						<Command.Root>
							<Command.Input placeholder="Search instructor..." />
							<Command.List>
								<Command.Empty>No instructor found.</Command.Empty>
								<Command.Group>
									{#each availableInstructors() as instructor (instructor)}
										<Command.Item
											value={instructor}
											onSelect={() => {
												toggleInstructor(instructor);
											}}
										>
											<CheckIcon
												class={cn(
													'mr-2 h-4 w-4',
													!selectedInstructors.includes(instructor) && 'text-transparent'
												)}
											/>
											{instructor}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>

				<!-- Selected instructors -->
				{#if selectedInstructors.length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						{#each selectedInstructors as instructor (instructor)}
							<span
								class="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
							>
								{instructor}
								<button
									type="button"
									onclick={() => removeInstructor(instructor)}
									class="rounded-sm hover:bg-secondary-foreground/20"
								>
									<XIcon class="h-3 w-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</aside>

		<!-- Course list -->
		<main class="flex-1 overflow-y-auto p-6">
			<div class="mx-auto max-w-4xl">
				<div class="mb-4 text-sm text-muted-foreground">
					Showing {filteredCourses().length} course{filteredCourses().length !== 1 ? 's' : ''}
				</div>

				<div class="space-y-4">
					{#each filteredCourses() as course (`${course.course_id}-${course.terms.join(',')}`)}
						<div class="rounded-lg border bg-card p-4 shadow-sm">
							<div class="mb-2 flex items-start justify-between">
								<div>
									<h3 class="text-lg font-semibold">{course.title}</h3>
									<p class="text-sm text-muted-foreground">
										{@html course.display_name}
										{#if course.units}
											<span class="ml-2">• {course.units} units</span>
										{/if}
									</p>
								</div>
								<span class="text-sm font-medium text-muted-foreground">{course.school}</span>
							</div>
							{#if course.description}
								<p class="text-sm text-muted-foreground">{course.description}</p>
							{/if}
						</div>
					{/each}
				</div>

				{#if filteredCourses().length === 0}
					<div class="py-12 text-center">
						<p class="text-muted-foreground">No courses found matching your filters.</p>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>
