# Claude Context Document

This document provides a comprehensive understanding of the course browsing application codebase, its architecture, and implementation details.

## Project Overview

This is a SvelteKit-based web application that allows users to browse, search, and filter college courses. The application provides an intuitive interface for exploring course offerings across different semesters, schools, departments, and instructors.

## Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn-svelte (Svelte port of shadcn/ui)
- **State Management**: Svelte 5 runes ($state, $derived, $effect)
- **Icons**: @lucide/svelte
- **Package Manager**: npm

## Data Structure

### Catalog Structure (src/lib/catalog.json)

The catalog follows a multi-semester structure:

```typescript
interface CatalogList {
  [semester: string]: CatalogData  // e.g., "2025 Fall", "2026 Spring"
}

interface CatalogData {
  meta: CatalogMetadata;
  courses: Course[];
}
```

**Important**: The catalog was refactored from a single flat structure to a multi-semester structure. Each semester now has its own complete catalog with metadata and courses.

### Metadata Structure

```typescript
interface CatalogMetadata {
  schools: {
    [key: string]: string[];  // School name -> array of departments
  };
  terms: string[];            // Available terms
  instructors: string[];      // All instructors (though we compute this dynamically)
}
```

The `schools` object is particularly important - it maps each school to its departments, which enables the cascading filter behavior (selecting a school filters available departments).

### Course Structure

```typescript
interface Course {
  course_id: string | null;        // Unique identifier (can be null)
  department: string | null;        // Department offering the course
  title: string;                    // Course title
  catalog_number: string;           // Course number (e.g., "CS 101")
  units: number | null;             // Credit units
  school: string;                   // School offering the course
  display_name: string;             // Formatted display name (HTML)
  description: string | null;       // Course description
  sections: Section[];              // Array of course sections
  terms: string[];                  // Terms when offered
}
```

**Key Insight**: Before the refactor, the same course could appear multiple times in the catalog with the same `course_id` but different terms. This caused duplicate key errors in Svelte's keyed each blocks. The multi-semester refactor resolved this by separating courses by semester.

### Section Structure

```typescript
interface Section {
  section_id: string;
  section_number: string;
  term: string;
  instructor: string[] | null;      // Array of instructors for this section
  delivery: string | null;          // Delivery method
  days: string[] | null;            // Days of the week
  time: SectionTime | null;         // Start/end times
  seats: SectionSeats | null;       // Enrollment information
}
```

**Important for Filtering**: Instructors are associated with **sections**, not courses directly. This means the instructor filter must check if ANY section of a course is taught by the selected instructor(s).

## Key Files

### src/lib/catalog.ts

This file:
1. Imports the raw JSON catalog data
2. Defines all TypeScript interfaces for type safety
3. Exports the catalog as a typed object
4. Exports the `Course` interface for use in components

```typescript
const Catalog = rawCatalog satisfies CatalogList;
export default Catalog;
export interface Course { ... }
```

The `satisfies` keyword ensures type checking while preserving the literal type.

### src/lib/catalog.json

The actual course data. This file is typically large (3500+ courses) and should not be read directly by Claude. Always reference `catalog.ts` for structure understanding.

### src/routes/+page.svelte

The main application UI. Contains all filtering logic, search functionality, and UI components.

## Implementation Details

### State Management

The application uses Svelte 5 runes for state management:

```typescript
// Mutable state
let selectedSemester = $state<string>(semesters[0]);
let searchQuery = $state('');
let selectedSchool = $state<string | null>(null);

// Derived/computed values
const currentCatalog = $derived(Catalog[selectedSemester]);
const schools = $derived(Object.keys(currentCatalog.meta.schools));
const filteredCourses = $derived(() => { /* filtering logic */ });
```

**Key Decision**: Using `$derived` for computed values ensures automatic reactivity. When `selectedSemester` changes, `currentCatalog` automatically updates, which cascades to `schools`, `filteredCourses`, etc.

### Semester Switching Mechanism

When a user switches semesters, we need to:
1. Load the new semester's catalog
2. Reset all filters (school, department, instructors, search)

This is implemented using a tracked previous value:

```typescript
let previousSemester = $state('');

$effect(() => {
  if (previousSemester !== '' && selectedSemester !== previousSemester) {
    // Reset all filters
    selectedSchool = null;
    selectedDepartment = null;
    selectedInstructors = [];
    searchQuery = '';
  }
  previousSemester = selectedSemester;
});
```

**Why this pattern?**: Direct effects that modify state can cause infinite loops. By tracking the previous value and only resetting when the semester actually changes, we avoid this issue.

### Filter Implementation

#### Cascading Filters (School → Department)

```typescript
const availableDepartments = $derived(
  selectedSchool ? currentCatalog.meta.schools[selectedSchool] || [] : []
);

// Auto-clear department if it's no longer valid
$effect(() => {
  if (selectedSchool && !availableDepartments.includes(selectedDepartment || '')) {
    selectedDepartment = null;
  }
});
```

This ensures that when a school is selected, only its departments are available. If the school changes and the currently selected department doesn't exist in the new school, it's automatically cleared.

#### Instructor Filter (Multi-Select)

Unlike school and department, instructors support multi-select:

```typescript
let selectedInstructors = $state<string[]>([]);

function toggleInstructor(instructor: string) {
  if (selectedInstructors.includes(instructor)) {
    selectedInstructors = selectedInstructors.filter((i) => i !== instructor);
  } else {
    selectedInstructors = [...selectedInstructors, instructor];
  }
}
```

Filtering logic checks if ANY section of a course matches:

```typescript
if (selectedInstructors.length > 0) {
  courses = courses.filter((course) =>
    course.sections.some((section) =>
      section.instructor?.some((instructor) =>
        selectedInstructors.includes(instructor)
      )
    )
  );
}
```

### Search Implementation

Currently searches through course titles and catalog numbers:

```typescript
if (searchQuery.trim()) {
  const query = searchQuery.toLowerCase();
  courses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(query) ||
      course.catalog_number.toLowerCase().includes(query)
  );
}
```

**Note**: The implementation is designed to be extensible. To add more search fields (e.g., description), simply add more conditions to the filter.

## UI Component Architecture

### shadcn-svelte Combobox Pattern

Comboboxes are built using a combination of `Popover` and `Command` components:

```svelte
<Popover.Root bind:open={popoverOpen}>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button {...props} variant="outline" role="combobox">
        {selectedValue || "Select..."}
        <ChevronsUpDownIcon />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content>
    <Command.Root>
      <Command.Input placeholder="Search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {#each items as item (item.id)}
            <Command.Item value={item.value} onSelect={() => handleSelect(item)}>
              <CheckIcon class={cn(selected !== item && "text-transparent")} />
              {item.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
```

**Key Pattern**: The `{#snippet child({ props })}` pattern is required for shadcn-svelte to properly wire up accessibility attributes and event handlers.

### Focus Management

After selecting an item, we refocus the trigger button for keyboard navigation:

```typescript
function closePopover() {
  popoverOpen = false;
  tick().then(() => triggerRef.focus());
}
```

The `tick()` ensures the DOM has updated before attempting to focus.

### Single-Select vs Multi-Select

**Single-Select** (School, Department, Semester):
- Closes popover after selection
- Shows clear button (X) when a value is selected
- Uses `string | null` for state

**Multi-Select** (Instructors):
- Keeps popover open after selection
- Shows selected count in trigger button
- Displays selected items as removable chips below
- Uses `string[]` for state

## Important Decisions & Gotchas

### 1. Each Block Key Selection

Initially used composite key `${course.course_id}-${course.terms.join(',')}` to handle duplicate course IDs across terms. After the multi-semester refactor, switched to just `course.course_id` since each semester's catalog is now separate.

### 2. Icon Imports

Must use `@lucide/svelte/icons/*` not `lucide-svelte/icons/*`:

```typescript
import CheckIcon from '@lucide/svelte/icons/check';  // ✅ Correct
import CheckIcon from 'lucide-svelte/icons/check';   // ❌ Wrong
```

### 3. display_name Contains HTML

The `display_name` field contains HTML (for formatting), so use `{@html}`:

```svelte
<p>{@html course.display_name}</p>
```

### 4. Accessibility Warnings

The label warnings (`a11y_label_has_associated_control`) are expected. The labels are semantic markers for the filter sections, not form labels in the traditional sense. These can be safely ignored or addressed later by converting to heading elements.

### 5. Derived Functions vs Values

Note the difference:

```typescript
// Derived value - computed once per dependency change
const schools = $derived(Object.keys(currentCatalog.meta.schools));

// Derived function - must be called each time, allows for more complex logic
const availableInstructors = $derived(() => {
  const instructorSet = new Set<string>();
  currentCatalog.courses.forEach(/* ... */);
  return Array.from(instructorSet).sort();
});
```

Use the function form when you need side effects or complex computations.

## Current Feature Set

### Implemented
- ✅ Semester selection (defaults to first semester)
- ✅ School filter (single-select with search)
- ✅ Department filter (single-select, dependent on school)
- ✅ Instructor filter (multi-select with chip display)
- ✅ Real-time search (title and catalog number)
- ✅ Automatic filter reset on semester change
- ✅ Responsive layout with sidebar and main content
- ✅ Course count display
- ✅ Empty state handling

### Not Yet Implemented
- ❌ Course detail view (clicking on a course)
- ❌ Section information display
- ❌ Time/schedule filtering
- ❌ Seat availability filtering
- ❌ Delivery method filtering
- ❌ Export/save functionality
- ❌ URL state persistence (filters in query params)
- ❌ Advanced search (description, instructor, course ID)

## Future Enhancement Guidelines

### Adding a New Filter

1. Add state variable:
   ```typescript
   let selectedTerm = $state<string | null>(null);
   ```

2. Create derived available options:
   ```typescript
   const availableTerms = $derived(currentCatalog.meta.terms);
   ```

3. Add filter logic to `filteredCourses`:
   ```typescript
   if (selectedTerm) {
     courses = courses.filter((course) => course.terms.includes(selectedTerm));
   }
   ```

4. Add UI combobox in sidebar
5. Add to semester change reset logic

### Expanding Search

To search additional fields, modify the search filter:

```typescript
if (searchQuery.trim()) {
  const query = searchQuery.toLowerCase();
  courses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(query) ||
      course.catalog_number.toLowerCase().includes(query) ||
      course.description?.toLowerCase().includes(query) ||  // Add this
      course.sections.some(s =>
        s.instructor?.some(i => i.toLowerCase().includes(query))  // Add this
      )
  );
}
```

### Adding Course Details

To add a detail view:
1. Add click handler to course card
2. Create state for selected course
3. Use shadcn Dialog component to show details
4. Display section information, instructor details, schedule, etc.

## Performance Considerations

### Current Performance Characteristics

- **Initial Load**: Fast - Svelte compiles to efficient JavaScript
- **Filtering**: Very fast - all filtering happens in memory with simple array operations
- **Catalog Size**: ~3500 courses load without performance issues
- **Reactivity**: Efficient - Svelte's fine-grained reactivity only updates what changed

### Potential Optimizations (if needed)

1. **Virtual Scrolling**: If course lists become very long (10,000+), implement virtual scrolling
2. **Search Debouncing**: Add debounce to search input for very large datasets
3. **Lazy Loading**: Load semesters on-demand rather than all at once
4. **Web Workers**: Move filtering logic to a worker for datasets > 100,000 courses

Currently, none of these optimizations are necessary.

## Testing Approach

### Manual Testing Checklist

- [ ] Semester selection updates available courses
- [ ] School selection filters departments correctly
- [ ] Department selection requires school selection first
- [ ] Instructor multi-select works (can select/deselect multiple)
- [ ] Search filters courses in real-time
- [ ] All filters work together (AND logic)
- [ ] Switching semesters resets all filters
- [ ] Empty state shows when no courses match
- [ ] Combobox search works for all filters

### Edge Cases to Consider

- Empty search results
- No departments for a school
- Course with no sections
- Section with no instructor
- Course with null description
- Switching rapidly between semesters

## Development Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production
npm run preview   # Preview production build
npm run check     # Type check with svelte-check
npm run format    # Format with Prettier
npm run lint      # Lint with ESLint
```

## Architecture Decisions

### Why SvelteKit?

- **Simplicity**: Less boilerplate than React
- **Performance**: Compiled approach, no virtual DOM
- **DX**: Excellent TypeScript support, intuitive reactivity
- **SSR**: Built-in server-side rendering capabilities

### Why shadcn-svelte?

- **Customizable**: Components are copied into project, not imported
- **Accessible**: Built on top of bits-ui (Svelte's Radix UI equivalent)
- **Unstyled**: Uses Tailwind for full design control
- **Type-safe**: Full TypeScript support

### Why Derived Values Over Stores?

Svelte 5 runes (`$state`, `$derived`) provide:
- Simpler API than stores
- Better TypeScript inference
- More predictable reactivity
- Closer to vanilla JavaScript

## Common Pitfalls

1. **Forgetting to call derived functions**: `filteredCourses()` not `filteredCourses`
2. **Modifying state in $effect without guards**: Leads to infinite loops
3. **Using wrong icon import path**: Must use `@lucide/svelte`
4. **Forgetting `{@html}` for display_name**: Shows raw HTML tags
5. **Not handling null values**: Many fields are `Nullable<T>`

## Summary

This application demonstrates modern Svelte 5 patterns for building reactive UIs with complex filtering logic. The architecture prioritizes:

- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Reactivity**: Efficient reactive updates using Svelte runes
- **Maintainability**: Clear separation of concerns, well-documented patterns
- **Extensibility**: Easy to add new filters, search fields, or features
- **User Experience**: Real-time updates, keyboard navigation, accessibility

The codebase is production-ready and well-structured for future enhancements.
