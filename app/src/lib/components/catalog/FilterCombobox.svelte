<script lang="ts">
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		label: string;
		value: string | null;
		items: string[];
		placeholder?: string;
		searchPlaceholder?: string;
		emptyMessage?: string;
		onSelect: (value: string) => void;
		clearable?: boolean;
		onClear?: () => void;
		disabled?: boolean;
	}

	let {
		label,
		value,
		items,
		placeholder = 'Select...',
		searchPlaceholder = 'Search...',
		emptyMessage = 'No results found.',
		onSelect,
		clearable = false,
		onClear,
		disabled = false
	}: Props = $props();

	let popoverOpen = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closePopover() {
		popoverOpen = false;
		tick().then(() => triggerRef?.focus());
	}

	function handleSelect(selectedValue: string) {
		onSelect(selectedValue);
		closePopover();
	}

	function handleClear(e: Event) {
		e.stopPropagation();
		if (onClear) {
			onClear();
		}
	}
</script>

<div class="mb-6">
	<label class="mb-2 block text-sm font-medium">{label}</label>
	<Popover.Root bind:open={popoverOpen}>
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class="w-full justify-between"
					role="combobox"
					aria-expanded={popoverOpen}
					{disabled}
				>
					<span class="truncate">
						{value || placeholder}
					</span>
					{#if clearable && value}
						<button
							type="button"
							onclick={handleClear}
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
				<Command.Input placeholder={searchPlaceholder} />
				<Command.List>
					<Command.Empty>{emptyMessage}</Command.Empty>
					<Command.Group>
						{#each items as item (item)}
							<Command.Item value={item} onSelect={() => handleSelect(item)}>
								<CheckIcon
									class={cn('mr-2 h-4 w-4', value !== item && 'text-transparent')}
								/>
								{item}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
