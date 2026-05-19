import {
  createFilterExpression,
  createFilterGroup,
  type FilterFieldDef,
  type FilterGroup,
} from '@cngx/forms/filter-builder';

export interface FilterBuilderPerson {
  readonly name: string;
  readonly age: number;
  readonly active: boolean;
  readonly birthday: string;
  readonly role: string;
}

export const FILTER_BUILDER_FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
  { key: 'active', label: 'Active', editorType: 'boolean' },
  { key: 'birthday', label: 'Birthday', editorType: 'date' },
  { key: 'role', label: 'Role', editorType: 'string' },
];

export const FILTER_BUILDER_PEOPLE: readonly FilterBuilderPerson[] = [
  { name: 'Alice Schmidt', age: 32, active: true, birthday: '1993-04-12', role: 'Engineer' },
  { name: 'Bob Müller', age: 41, active: false, birthday: '1984-11-03', role: 'Designer' },
  { name: 'Charlie Wang', age: 28, active: true, birthday: '1997-07-21', role: 'Manager' },
  { name: 'Diana Rossi', age: 36, active: true, birthday: '1989-02-08', role: 'Engineer' },
  { name: 'Erik Larsson', age: 45, active: false, birthday: '1980-09-30', role: 'DevOps' },
  { name: 'Fatima Ali', age: 29, active: true, birthday: '1996-05-17', role: 'Engineer' },
  { name: 'Georg Bauer', age: 52, active: false, birthday: '1973-08-25', role: 'Designer' },
  { name: 'Helen Kim', age: 38, active: true, birthday: '1987-12-04', role: 'Manager' },
];

export const FILTER_BUILDER_SEED: FilterGroup = createFilterGroup('and', [
  createFilterExpression('role', 'eq', 'Engineer'),
  createFilterExpression('active', 'eq', true),
]);
