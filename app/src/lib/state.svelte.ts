import { browser } from '$app/environment';
import type { Course } from './catalog';

const STORAGE_KEY = 'selectedCourses';
let selectedCourses = $state<Course[]>([]);
if (browser) {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Course[];
      selectedCourses.length = 0;
      selectedCourses.push(...parsed);
    } catch (e) {
      console.error('Could not parse selectedCourses from localStorage:', e);
    }
  }

  $effect.root(() => {
    $effect(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCourses));
    });
  });
}

export { selectedCourses };