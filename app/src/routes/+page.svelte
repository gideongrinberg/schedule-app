<script lang="ts">
	import Catalog from '$lib/catalog';
	import type { Course } from '$lib/catalog';
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';
	import FilterIcon from '@lucide/svelte/icons/filter';

	// Get available semesters from catalog
	const semesters = Object.keys(Catalog);

	// State for filters
	let selectedSemester = $state<string>(semesters[0]);
	let searchQuery = $state('');
	let selectedSchool = $state<string | null>(null);
	let selectedDepartment = $state<string | null>(null);
	let selectedInstructors = $state<string[]>([]);
	let creditsRange = $state<[number, number]>([0, 20]);
	let includeVariableCredits = $state(true);
	let openCoursesOnly = $state(false);

	// State for selected course
	let selectedCourse = $state<Course | null>(null);

	// State for mobile filter drawer
	let mobileFiltersOpen = $state(false);

	// Popover states
	let semesterPopoverOpen = $state(false);
	let schoolPopoverOpen = $state(false);
	let departmentPopoverOpen = $state(false);
	let instructorPopoverOpen = $state(false);

	// Refs for refocusing
	let semesterTriggerRef = $state<HTMLButtonElement>(null!);
	let schoolTriggerRef = $state<HTMLButtonElement>(null!);
	let departmentTriggerRef = $state<HTMLButtonElement>(null!);
	let instructorTriggerRef = $state<HTMLButtonElement>(null!);

	// Derived: current catalog based on selected semester
	const currentCatalog = $derived(Catalog[selectedSemester]);

	// Derived: available options from current catalog
	const schools = $derived(Object.keys(currentCatalog.meta.schools));

	const availableDepartments = $derived(
		selectedSchool ? currentCatalog.meta.schools[selectedSchool] || [] : []
	);

	const availableInstructors = $derived(() => {
		const instructorSet = new Set<string>();
		currentCatalog.courses.forEach((course) => {
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

	// Derived: min/max credits from current catalog
	const creditsRange_min = $derived(() => {
		const units = currentCatalog.courses
			.map((course) => course.units)
			.filter((u): u is number => u !== null);
		return units.length > 0 ? Math.min(...units) : 0;
	});

	const creditsRange_max = $derived(() => {
		const units = currentCatalog.courses
			.map((course) => course.units)
			.filter((u): u is number => u !== null);
		return units.length > 0 ? Math.max(...units) : 20;
	});

	// Derived: filtered courses
	const filteredCourses = $derived(() => {
		let courses = currentCatalog.courses;
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

		// Apply credits filter
		courses = courses.filter((course) => {
			if (course.units === null) return includeVariableCredits;
			return course.units >= creditsRange[0] && course.units <= creditsRange[1];
		});

		// Apply open courses filter
		if (openCoursesOnly) {
			courses = courses.filter((course) =>
				course.sections.some(
					(section) => section.seats && section.seats.filled < section.seats.total
				)
			);
		}

		return courses;
	});

	function closeSemesterPopover() {
		semesterPopoverOpen = false;
		tick().then(() => semesterTriggerRef.focus());
	}

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

	function selectCourse(course: Course) {
		selectedCourse = course;
	}

	function clearSelection() {
		selectedCourse = null;
	}

	// Helper function to format time (assumes time is in minutes since midnight)
	function formatTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
	}

	// Watch for school changes to reset department
	$effect(() => {
		if (selectedSchool && !availableDepartments.includes(selectedDepartment || '')) {
			selectedDepartment = null;
		}
	});

	// Initialize credits range on first load
	$effect(() => {
		if (creditsRange[0] === 0 && creditsRange[1] === 20) {
			creditsRange = [creditsRange_min(), creditsRange_max()];
		}
	});

	// Track previous semester to detect changes
	let previousSemester = $state('');

	// Watch for semester changes to reset all other filters
	$effect(() => {
		// Only reset if semester actually changed (skip initial render)
		if (previousSemester !== '' && selectedSemester !== previousSemester) {
			selectedSchool = null;
			selectedDepartment = null;
			selectedInstructors = [];
			searchQuery = '';
			creditsRange = [creditsRange_min(), creditsRange_max()];
			includeVariableCredits = true;
			openCoursesOnly = false;
		}
		previousSemester = selectedSemester;
	});
</script>

<div class="flex h-screen flex-col">
	<!-- Top bar with search -->
	<div class="border-b bg-background p-4">
		<div class="mx-auto max-w-7xl flex items-center gap-3">
			<button
				type="button"
				onclick={() => (mobileFiltersOpen = !mobileFiltersOpen)}
				class="lg:hidden rounded-md p-2 hover:bg-accent"
				aria-label="Toggle filters"
			>
				<FilterIcon class="h-5 w-5" />
			</button>
			<input
				type="text"
				placeholder="Search courses by title or catalog number..."
				bind:value={searchQuery}
				class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			/>
		</div>
	</div>

	<!-- Main content area -->
	<div class="flex flex-1 overflow-hidden relative">
		<!-- Mobile backdrop -->
		{#if mobileFiltersOpen}
			<button
				type="button"
				onclick={() => (mobileFiltersOpen = false)}
				class="fixed inset-0 bg-black/50 z-40 lg:hidden"
				aria-label="Close filters"
			></button>
		{/if}

		<!-- Sidebar -->
		<aside
			class={cn(
				"w-64 bg-background p-4 overflow-y-auto transition-transform duration-300 ease-in-out",
				"fixed inset-y-0 left-0 z-50 border-r lg:static lg:z-0",
				!mobileFiltersOpen && "-translate-x-full lg:translate-x-0"
			)}
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Filters</h2>
				<button
					type="button"
					onclick={() => (mobileFiltersOpen = false)}
					class="lg:hidden rounded-sm p-1 hover:bg-secondary"
					aria-label="Close filters"
				>
					<XIcon class="h-5 w-5" />
				</button>
			</div>

			<!-- Semester Filter -->
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium">Semester</label>
				<Popover.Root bind:open={semesterPopoverOpen}>
					<Popover.Trigger bind:ref={semesterTriggerRef}>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="w-full justify-between"
								role="combobox"
								aria-expanded={semesterPopoverOpen}
							>
								<span class="truncate">
									{selectedSemester}
								</span>
								<ChevronsUpDownIcon class="ml-2 h-4 w-4 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[240px] p-0">
						<Command.Root>
							<Command.Input placeholder="Search semester..." />
							<Command.List>
								<Command.Empty>No semester found.</Command.Empty>
								<Command.Group>
									{#each semesters as semester (semester)}
										<Command.Item
											value={semester}
											onSelect={() => {
												selectedSemester = semester;
												closeSemesterPopover();
											}}
										>
											<CheckIcon
												class={cn(
													'mr-2 h-4 w-4',
													selectedSemester !== semester && 'text-transparent'
												)}
											/>
											{semester}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</div>

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

			<!-- Credits Filter -->
			<div>
				<label class="mb-2 block text-sm font-medium">Credits</label>
				<div class="px-2">
					<Slider
						type="multiple"
						bind:value={creditsRange}
						min={creditsRange_min()}
						max={creditsRange_max()}
						step={0.5}
						class="w-full"
					/>
				</div>
				<div class="mt-2 flex justify-between text-xs text-muted-foreground">
					<span>{creditsRange[0]} units</span>
					<span>{creditsRange[1]} units</span>
				</div>
				<div class="mt-3">
					<label class="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							bind:checked={includeVariableCredits}
							class="h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						/>
						Include variable credit courses
					</label>
				</div>
			</div>

			<!-- Open Courses Only Filter -->
			<div class="mt-2">
				<label class="flex items-center gap-2 text-sm cursor-pointer">
					<input
						type="checkbox"
						bind:checked={openCoursesOnly}
						class="h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					/>
					Open courses only
				</label>
			</div>
		</aside>

		<!-- Course list -->
		<main class="flex-1 overflow-y-auto p-4 md:p-6 lg:border-r">
			<div class="mx-auto max-w-full lg:max-w-2xl">
				<div class="mb-4 text-sm text-muted-foreground">
					Showing {filteredCourses().length} course{filteredCourses().length !== 1 ? 's' : ''}
				</div>

				<div class="space-y-4">
					{#each filteredCourses() as course (course.course_id)}
						<button
							type="button"
							onclick={() => selectCourse(course)}
							class={cn(
								"w-full rounded-lg border bg-card p-4 shadow-sm text-left transition-colors hover:bg-accent",
								selectedCourse?.course_id === course.course_id && "ring-2 ring-ring"
							)}
						>
							<div class="mb-2 flex items-start justify-between gap-2">
								<div class="flex-1">
									<h3 class="text-lg font-semibold">{@html course.display_name}</h3>
									<p class="text-sm text-muted-foreground">
										{#if course.units}
											{course.units} units
										{/if}
									</p>
								</div>
								<span class="text-sm font-medium text-muted-foreground">{course.school}</span>
							</div>
							<!-- {#if course.description}
								<p class="text-sm text-muted-foreground">{course.description}</p>
							{/if} -->
						</button>
					{/each}
				</div>

				{#if filteredCourses().length === 0}
					<div class="py-12 text-center">
						<p class="text-muted-foreground">No courses found matching your filters.</p>
					</div>
				{/if}
			</div>
		</main>

		<!-- Course Details Panel -->
		{#if selectedCourse}
			<aside
				class={cn(
					"overflow-y-auto bg-background p-4 md:p-6",
					"fixed inset-0 z-50 lg:static lg:w-[500px]"
				)}
			>
				<div class="mb-4 flex items-start justify-between">
					<div class="flex-1">
						<h2 class="text-2xl font-semibold">{selectedCourse.title}</h2>
						<p class="text-sm text-muted-foreground mt-1">
							{@html selectedCourse.display_name}
						</p>
					</div>
					<button
						type="button"
						onclick={clearSelection}
						class="rounded-sm p-1 hover:bg-secondary"
						aria-label="Close details"
					>
						<XIcon class="h-5 w-5" />
					</button>
				</div>

				<div class="space-y-6">
					<!-- Course Information -->
					<div class="space-y-2">
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span class="font-medium">School:</span>
								<span class="ml-2 text-muted-foreground">{selectedCourse.school}</span>
							</div>
							{#if selectedCourse.department}
								<div>
									<span class="font-medium">Department:</span>
									<span class="ml-2 text-muted-foreground">{selectedCourse.department}</span>
								</div>
							{/if}
							{#if selectedCourse.units}
								<div>
									<span class="font-medium">Units:</span>
									<span class="ml-2 text-muted-foreground">{selectedCourse.units}</span>
								</div>
							{/if}
							{#if selectedCourse.course_id}
								<div>
									<span class="font-medium">Course ID:</span>
									<span class="ml-2 text-muted-foreground">{selectedCourse.course_id}</span>
								</div>
							{/if}
						</div>

						{#if selectedCourse.description}
							<div class="pt-2">
								<p class="font-medium">Description:</p>
								<p class="mt-1 text-sm text-muted-foreground">{selectedCourse.description}</p>
							</div>
						{/if}
					</div>

					<!-- Sections -->
					<div>
						<h3 class="mb-3 text-lg font-semibold">
							Sections ({selectedCourse.sections.length})
						</h3>

						<div class="space-y-3">
							{#each selectedCourse.sections as section (section.section_id)}
								<div class="rounded-md border bg-muted/50 p-4">
									<div class="mb-2 flex items-start justify-between">
										<div>
											<span class="font-medium">Section {section.section_number}</span>
											{#if section.term}
												<span class="ml-2 text-sm text-muted-foreground">• {section.term}</span>
											{/if}
										</div>
										{#if section.seats}
											<span
												class="text-sm"
												class:text-destructive={section.seats.filled >= section.seats.total}
												class:text-green-600={section.seats.filled < section.seats.total}
											>
												{section.seats.filled}/{section.seats.total} seats taken
											</span>
										{/if}
									</div>

									<div class="space-y-1 text-sm">
										{#if section.instructor && section.instructor.length > 0}
											<div>
												<span class="font-medium">Instructor:</span>
												<span class="ml-2 text-muted-foreground">
													{section.instructor.join(', ')}
												</span>
											</div>
										{/if}

										{#if section.days && section.days.length > 0}
											<div>
												<span class="font-medium">Days:</span>
												<span class="ml-2 text-muted-foreground">
													{section.days.join(', ')}
												</span>
											</div>
										{/if}

										{#if section.time}
											<div>
												<span class="font-medium">Time:</span>
												<span class="ml-2 text-muted-foreground">
													{formatTime(section.time.start)} - {formatTime(section.time.end)}
												</span>
											</div>
										{/if}

										{#if section.delivery}
											<div>
												<span class="font-medium">Delivery:</span>
												<span class="ml-2 text-muted-foreground">{section.delivery}</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</aside>
		{/if}
	</div>
</div>
