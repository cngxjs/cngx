import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypeahead: typeahead cngxselectoptionlabel slot override',
  subtitle: 'Same slot family as CngxSelect - project a custom <code>*cngxSelectOptionLabel</code> template to render avatars / badges / two-line layouts in the typeahead listbox.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxTypeahead',
    'CngxSelectOptionLabel',
  ],
  moduleImports: [
    'import { CngxSelectOptionLabel, CngxTypeahead, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
  ],
  imports: ['CngxTypeahead', 'CngxSelectOptionLabel'],
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
  protected readonly typeaheadDisplay = (u: { id: number; name: string }): string => u.name;`,
  template: `  <cngx-typeahead
    [label]="'User'"
    [options]="typeaheadUsers"
    [compareWith]="typeaheadCompare"
    [displayWith]="typeaheadDisplay"
    [(value)]="typeaheadValue"
    placeholder="Search by name…"
  >
    <ng-template cngxSelectOptionLabel let-opt>
      <span style="display:flex;align-items:center;gap:0.5rem">
        <span aria-hidden="true" class="demo-typeahead-option-icon">
          {{ opt.label.charAt(0) }}
        </span>
        <span>
          <strong>{{ opt.label }}</strong>
          <small class="demo-typeahead-option-id">id: {{ opt.value.id }}</small>
        </span>
      </span>
    </ng-template>
  </cngx-typeahead>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ typeaheadValue()?.name ?? '—' }}</span></div>
  </div>`,
};
