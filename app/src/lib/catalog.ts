import rawCatalog from '$lib/catalog.json';

const Catalog = rawCatalog as Catalog;
export default Catalog;

type Nullable<T> = T | null;

interface Catalog {
	[term: string]: Course[];
}

export interface Course {
	id: string;
	school: string;
	department: string;
	title: string;
	catalogNumber: string;
	units: Nullable<number>;
	description: string;
	level: string;
	sections: {
		lecture: Section[];
		lab?: Section[];
	};
}

export interface Section {
	id: string;
	number: string;
	term: string;
	instructor: string[];
	delivery: string;
	days?: string[];
	time: Nullable<[number, number]>;
	seats: Nullable<[number, number]>;
}
