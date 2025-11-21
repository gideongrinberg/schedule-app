<script lang="ts">
	import type { Course } from '$lib/catalog';
	import { cn } from '$lib/utils.js';

	interface Props {
		course: Course;
		selected: boolean;
		onclick: () => void;
	}

	let { course, selected, onclick }: Props = $props();
</script>

<button
	type="button"
	onclick={onclick}
	class={cn(
		"w-full rounded-lg border bg-card p-4 shadow-sm text-left transition-colors hover:bg-accent",
		selected && "ring-2 ring-ring"
	)}
>
	<div class="mb-2 flex items-start justify-between gap-2">
		<div class="flex-1">
			<h3 class="text-lg font-semibold">{course.catalog_number}</h3>
			<p class="text-sm text-muted-foreground">
				{course.title}
				{#if course.units}
				<br/>{course.units} units
				{/if}
			</p>
		</div>
		<span class="text-sm font-medium text-muted-foreground">{course.school}</span>
	</div>
</button>
