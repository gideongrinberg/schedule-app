import rawCatalog from '$lib/catalog.json';

const Catalog = rawCatalog satisfies CatalogList;
export default Catalog;

type Nullable<T> = T | null;

interface CatalogList {
	[semster: string]: CatalogData
}

interface CatalogData {
	meta: CatalogMetadata;
	courses: Course[];
}

interface CatalogMetadata {
	schools: {
		[key: string]: string[];
	};
	terms: string[];
	instructors: string[];
}

export interface Course {
	course_id: Nullable<string>;
	department: Nullable<string>;
	title: string;
	catalog_number: string;
	units: Nullable<number>;
	school: string;
	display_name: string;
	description: Nullable<string>;
	sections: Section[];
	terms: string[];
}

interface Section {
	section_id: string;
	section_number: string;
	term: string;
	instructor: Nullable<string[]>;
	delivery: Nullable<string>;
	days: Nullable<string[]>;
	time: Nullable<SectionTime>;
	seats: Nullable<SectionSeats>;
}

interface SectionTime {
	start: number;
	end: number;
}

interface SectionSeats {
	filled: number;
	total: number;
}
