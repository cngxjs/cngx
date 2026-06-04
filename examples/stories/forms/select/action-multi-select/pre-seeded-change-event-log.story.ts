import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionMultiSelect: pre seeded change event log',
  subtitle: 'Component starts with <em>Design</em> and <em>QA</em> selected. The <code>(selectionChange)</code> log shows the <code>action</code> discriminant for each event - toggle vs create vs clear. Use it to drive audit logs, analytics, or backend sync.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionMultiSelect',
    'CngxSelectAction',
  ],
  moduleImports: [
    'import { CngxActionMultiSelect, type CngxActionMultiSelectChange, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { of } from \'rxjs\';',
  ],
  imports: ['CngxActionMultiSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
    { value: { id: 't5', name: 'Review' }, label: 'Review' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly seededValues = signal<{ id: string; name: string }[]>([
    { id: 't1', name: 'Design' },
    { id: 't3', name: 'QA' },
  ]);
  protected readonly seededLog = signal<string[]>([]);
  protected seededCounter = 0;
  protected readonly seededCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'seeded-' + ++this.seededCounter, name: draft.label });
  protected handleSeededChange(ev: CngxActionMultiSelectChange<{ id: string; name: string }>): void {
    const ts = new Date().toLocaleTimeString();
    const line = ts + ' → ' + ev.action + ' | values=' + ev.values.map((v) => v.name).join(', ');
    this.seededLog.update((l) => [...l.slice(-4), line]);
  }`,
  template: `  <cngx-action-multi-select
    [label]="'Tags (pre-seeded)'"
    [options]="tags"
    [compareWith]="basicCompare"
    [quickCreateAction]="seededCreate"
    [clearable]="true"
    [(values)]="seededValues"
    (selectionChange)="handleSeededChange($event)"
  >
    <ng-template cngxSelectAction let-term let-commit="commit">
      <button
        type="button"
        [disabled]="!term"
        (click)="commit()"
        style="
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 0;
          border-top: 1px solid var(--cngx-color-border, #e5e7eb);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font: inherit;
        "
      >
        + Create "{{ term || '…' }}"
      </button>
    </ng-template>
  </cngx-action-multi-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Values</span>
      <span class="event-value">{{ seededValues().map(v => v.name).join(', ') || '—' }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">change</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
