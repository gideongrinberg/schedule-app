<script lang="ts">
	import type { Section } from '$lib/catalog';
	import { formatSectionSchedule } from '$lib/utils/time-formatting';
	import * as Select from '$lib/components/ui/select';
	import { tick } from 'svelte';

	interface Props {
		sections: Section[];
		selectedSection: Section | null;
		onSelect: (section: Section) => void;
		conflictingSections?: string[];
		label: string;
	}

	let { sections, selectedSection, onSelect, conflictingSections = [], label }: Props = $props();

	let selectedValue = $state(selectedSection?.id || '');

	// Update selectedValue when selectedSection changes
	$effect(() => {
		selectedValue = selectedSection?.id || '';
	});

	// Handle value change
	$effect(() => {
		if (selectedValue) {
			const section = sections.find((s) => s.id === selectedValue);
			if (section && section.id !== selectedSection?.id) {
				onSelect(section);
				// Check if selection was accepted after reactive updates
				tick().then(() => {
					// If the prop didn't update to match, the selection was rejected
					if (selectedSection?.id !== selectedValue) {
						// Revert to the current valid selection
						selectedValue = selectedSection?.id || '';
					}
				});
			}
		}
	});

	// Format section display text
	function formatSectionDisplay(section: Section): string {
		const schedule = formatSectionSchedule(section.time, section.days);
		const instructors = section.instructor.length > 0 ? section.instructor.join(', ') : 'TBA';
		const seats = section.seats
			? `${section.seats[0]}/${section.seats[1]} seats`
			: 'Seats unavailable';

		return `Section ${section.number} • ${schedule} • ${instructors} • ${seats}`;
	}

	// Check if section is full
	function isSectionFull(section: Section): boolean {
		if (!section.seats) return false;
		return section.seats[0] >= section.seats[1];
	}
</script>

<div class="space-y-1">
	<label for="section-selector-{label}" class="text-sm font-medium">{label}</label>
	<Select.Root type="single" bind:value={selectedValue}>
		<Select.Trigger class="w-full" id="section-selector-{label}">
			<span class="block truncate text-left" title={selectedSection ? formatSectionDisplay(selectedSection) : ''}>
				{#if selectedSection}
					{formatSectionDisplay(selectedSection)}
				{:else}
					Select section
				{/if}
			</span>
		</Select.Trigger>
		<Select.Content class="max-h-80">
			{#each sections as section (section.id)}
				{@const isConflicting = conflictingSections.includes(section.id)}
				{@const isFull = isSectionFull(section)}
				<Select.Item
					value={section.id}
					disabled={isConflicting}
					class={isConflicting
						? 'text-destructive opacity-50'
						: isFull
							? 'text-orange-600'
							: ''}
				>
					<div class="flex flex-col items-start gap-0.5">
						<div class="font-medium">
							Section {section.number}
							{#if isConflicting}
								<span class="ml-1 text-xs text-destructive">(Conflict)</span>
							{:else if isFull}
								<span class="ml-1 text-xs text-orange-600">(Full)</span>
							{/if}
						</div>
						<div class="text-xs text-muted-foreground">
							{formatSectionSchedule(section.time, section.days)}
						</div>
						<div class="text-xs text-muted-foreground">
							{section.instructor.length > 0 ? section.instructor.join(', ') : 'TBA'}
							{#if section.seats}
								• {section.seats[0]}/{section.seats[1]} enrolled
							{/if}
						</div>
					</div>
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
