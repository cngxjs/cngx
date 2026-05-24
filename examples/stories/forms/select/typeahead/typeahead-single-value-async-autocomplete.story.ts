import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypeahead: typeahead single value async autocomplete',
  subtitle: 'Inline <code>&lt;input role="combobox"&gt;</code> with <code>displayWith</code> - type to filter, pick to commit a single value. The input shows <code>displayWith(value)</code> after a pick so the selection survives blur/refocus. <code>clearOnBlur</code> (default <code>true</code>) snaps the input back to the last-committed display if the user types stray text without picking.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxTypeahead',
  ],
  moduleImports: [
    'import { CngxTypeahead, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxTypeahead'],
  setup: `protected readonly typeaheadUsers: CngxSelectOptionDef<{ id: number; name: string }>[] = [
    { value: { id: 1, name: 'Alice Meier' },  label: 'Alice Meier' },
    { value: { id: 2, name: 'Bob Schmidt' },  label: 'Bob Schmidt' },
    { value: { id: 3, name: 'Charlotte Fischer' }, label: 'Charlotte Fischer' },
    { value: { id: 4, name: 'David Weber' }, label: 'David Weber' },
    { value: { id: 5, name: 'Eva Wagner' }, label: 'Eva Wagner' },
  ];
  protected readonly typeaheadValue = signal<{ id: number; name: string } | undefined>(undefined);
  protected readonly typeaheadCompare = (a: { id: number } | undefined, b: { id: number } | undefined): boolean =>
    (a?.id ?? NaN) === (b?.id ?? NaN);
  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;
  protected readonly typeaheadSearchLog = signal<string[]>([]);
  protected handleTypeaheadSearch(term: string): void {
    this.typeaheadSearchLog.update(l => [...l.slice(-4), term]);
  }`,
  template: `  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [clearable]="true"
    placeholder="Search by name…"
    [(value)]="typeaheadValue"
    (searchTermChange)="handleTypeaheadSearch($event)"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadValue()?.name || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Search log</span><span class="event-value">{{ typeaheadSearchLog().join(' → ') || '—' }}</span></div>
  </div>`,
};
