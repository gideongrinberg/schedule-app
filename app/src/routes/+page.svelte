<script lang="ts">
	import Catalog from '$lib/catalog';
	import type { Course } from '$lib/catalog';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { cn } from '$lib/utils.js';
	import XIcon from '@lucide/svelte/icons/x';
	import FilterIcon from '@lucide/svelte/icons/filter';
	import FilterCombobox from '$lib/components/catalog/FilterCombobox.svelte';
	import MultiSelectCombobox from '$lib/components/catalog/MultiSelectCombobox.svelte';
	import CourseDetails from '$lib/components/catalog/CourseDetails.svelte';
	import CourseCard from '$lib/components/catalog/CourseCard.svelte';

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

	let mobileFiltersOpen = $state(false);
	let selectedCourse = $state<Course | null>(null);

	// Derived catalog/filter values
	const currentCatalog = $derived(Catalog[selectedSemester]);
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

	// Get minimum and maximum credit ranges for current catalog
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

	// Derive the full list of courses based on current filters.
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

	// Helper function to format time
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

	$effect(() => {
		if (creditsRange[0] === 0 && creditsRange[1] === 20) {
			creditsRange = [creditsRange_min(), creditsRange_max()];
		}
	});

	// Watch for semester changes to reset all other filters
	let previousSemester = $state('');
	$effect(() => {
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
	<!-- Top bar with filter button -->
	<div class="border-b bg-background p-4 lg:hidden">
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={() => (mobileFiltersOpen = !mobileFiltersOpen)}
				class="rounded-md p-2 hover:bg-accent"
				aria-label="Toggle filters"
			>
				<FilterIcon class="h-5 w-5" />
			</button>
			<span class="text-sm font-medium">Filters</span>
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

			<!-- Search -->
			<div class="mb-6">
				<input
					type="text"
					placeholder="Search courses..."
					bind:value={searchQuery}
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
			</div>

			<!-- Semester Filter -->
			<FilterCombobox
				label="Semester"
				value={selectedSemester}
				items={semesters}
				searchPlaceholder="Search semester..."
				emptyMessage="No semester found."
				onSelect={(semester) => (selectedSemester = semester)}
			/>

			<!-- School Filter -->
			<FilterCombobox
				label="School"
				value={selectedSchool}
				items={schools}
				placeholder="Select school..."
				searchPlaceholder="Search school..."
				emptyMessage="No school found."
				onSelect={(school) => (selectedSchool = school)}
				clearable={true}
				onClear={clearSchool}
			/>

			<!-- Department Filter -->
			<FilterCombobox
				label="Department"
				value={selectedDepartment}
				items={availableDepartments}
				placeholder="Select department..."
				searchPlaceholder="Search department..."
				emptyMessage="No department found."
				onSelect={(department) => (selectedDepartment = department)}
				clearable={true}
				onClear={clearDepartment}
				disabled={!selectedSchool}
			/>

			<!-- Instructor Filter (Multi-select) -->
			<MultiSelectCombobox
				label="Instructors"
				value={selectedInstructors}
				items={availableInstructors()}
				placeholder="Select instructors..."
				searchPlaceholder="Search instructor..."
				emptyMessage="No instructor found."
				onToggle={toggleInstructor}
				onRemove={removeInstructor}
			/>

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
			<div class="mx-auto max-w-full lg:max-w-lg">
				<div class="mb-4 text-sm text-muted-foreground">
					Showing {filteredCourses().length} course{filteredCourses().length !== 1 ? 's' : ''}
				</div>

				<div class="space-y-4">
					{#each filteredCourses() as course (course.course_id)}
						<CourseCard
							{course}
							selected={selectedCourse?.course_id === course.course_id}
							onclick={() => selectCourse(course)}
						/>
					{/each}
				</div>

				{#if filteredCourses().length === 0}
					<div class="py-12 text-center">
						<p class="text-muted-fosmreground">No courses found matching your filters.</p>
					</div>
				{/if}
			</div>
		</main>

		<!-- Course Details Panel -->
		<aside
			class={cn(
				"overflow-y-auto bg-background p-4 md:p-6",
				"hidden lg:block lg:w-[700px]",
				selectedCourse && "fixed inset-0 z-50 block lg:static"
			)}
		>
			<CourseDetails
				course={selectedCourse}
				onClose={clearSelection}
				{formatTime}
			/>
		</aside>
	</div>
</div>
