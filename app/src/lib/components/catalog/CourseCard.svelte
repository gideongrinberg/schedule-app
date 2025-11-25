<script lang="ts">
	import type { Course } from '$lib/catalog';
	import { cn } from '$lib/utils.js';
	import Button from '../ui/button/button.svelte';

	interface Props {
		course: Course;
		selected: boolean;
		onclick: () => void;
	}

	let { course, selected, onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	role="button"
	tabindex="0"
	{onclick}
	class={cn(
		'w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent',
		selected && 'ring-2 ring-ring'
	)}
>
	<div class="mb-2 flex items-start justify-between gap-2">
		<div class="flex-1">
			<h3 class="text-lg font-semibold">{course.catalog_number}</h3>
			<p class="text-sm text-muted-foreground">
				{course.title}
				{#if course.units}
					<br />{course.units} units
				{/if}
			</p>
		</div>
		<span class="text-sm font-medium text-muted-foreground">{course.school}</span>
	</div>
	<div class="mt-1 flex justify-end">
		<Button
			class="border px-3 py-1"
			onclick={(e: Event) => {
				e.stopPropagation();
			}}>Add Course</Button
		>
	</div>
</div>
