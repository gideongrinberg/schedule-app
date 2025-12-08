<script lang="ts">
	import type { Course, Section } from '$lib/catalog';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		course: Course | null;
		onClose: () => void;
		formatTime: (minutes: number) => string;
	}

	let { course, onClose, formatTime }: Props = $props();

	// Helper to get all sections (both lecture and lab)
	function getAllSections(course: Course): Array<{ section: Section; type: 'Lecture' | 'Lab' }> {
		const sections: Array<{ section: Section; type: 'Lecture' | 'Lab' }> = [];
		course.sections.lecture.forEach((section) => sections.push({ section, type: 'Lecture' }));
		if (course.sections.lab) {
			course.sections.lab.forEach((section) => sections.push({ section, type: 'Lab' }));
		}
		return sections;
	}
</script>

{#if course}
	<div class="mb-4 flex items-start justify-between">
		<div class="flex-1">
			<h2 class="text-2xl font-semibold">{course.title}</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{course.catalogNumber} • {course.level}
			</p>
		</div>
		<button
			type="button"
			onclick={onClose}
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
					<span class="ml-2 text-muted-foreground">{course.school}</span>
				</div>
				<div>
					<span class="font-medium">Department:</span>
					<span class="ml-2 text-muted-foreground">{course.department}</span>
				</div>
				{#if course.units}
					<div>
						<span class="font-medium">Units:</span>
						<span class="ml-2 text-muted-foreground">{course.units}</span>
					</div>
				{:else}
					<div>
						<span class="font-medium">Units:</span>
						<span class="ml-2 text-muted-foreground">Variable</span>
					</div>
				{/if}
				<div>
					<span class="font-medium">Course ID:</span>
					<span class="ml-2 text-muted-foreground">{course.id}</span>
				</div>
			</div>

			{#if course.description}
				<div class="pt-2">
					<p class="font-medium">Description:</p>
					<p class="mt-1 text-sm text-muted-foreground">{course.description}</p>
				</div>
			{/if}
		</div>

		<!-- Sections -->
		<div>
			<h3 class="mb-3 text-lg font-semibold">
				Sections ({course.sections.lecture.length + (course.sections.lab?.length || 0)})
			</h3>

			<div class="space-y-3">
				{#each getAllSections(course) as { section, type } (section.id)}
					<div class="rounded-md border bg-muted/50 p-4">
						<div class="mb-2 flex items-start justify-between">
							<div>
								<span class="font-medium">{type} {section.number}</span>
								<span class="ml-2 text-sm text-muted-foreground"
									>• {section.term}</span
								>
							</div>
							{#if section.seats}
								<span
									class="text-sm"
									class:text-destructive={section.seats[0] >= section.seats[1]}
									class:text-green-600={section.seats[0] < section.seats[1]}
								>
									{section.seats[0]}/{section.seats[1]} seats taken
								</span>
							{/if}
						</div>

						<div class="space-y-1 text-sm">
							{#if section.instructor.length > 0}
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
										{formatTime(section.time[0])} - {formatTime(
											section.time[1]
										)}
									</span>
								</div>
							{/if}

							<div>
								<span class="font-medium">Delivery:</span>
								<span class="ml-2 text-muted-foreground">{section.delivery}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{:else}
	<!-- Empty state when no course selected -->
	<div class="flex h-full items-center justify-center p-8">
		<div class="text-center">
			<h2 class="text-xl font-semibold text-muted-foreground">No course selected</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Select a course from the list to view details
			</p>
		</div>
	</div>
{/if}
