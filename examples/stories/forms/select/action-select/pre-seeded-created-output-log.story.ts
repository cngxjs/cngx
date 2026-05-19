import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Pre-seeded + (created) output log',
  subtitle: 'Component starts with <em>Development</em> already selected. The <code>(created)</code> output fires after every successful quick-create — dedicated channel for consumers that only care about creation events without branching on <code>action === \'create\'</code>.',
  description: 'CngxActionSelect — single-value autocomplete with inline quick-create. Seventh sibling of the select family; thin organism on top of createSelectCore + createCreateCommitHandler.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
    'provideActionSelectConfig',
    'createCreateCommitHandler',
  ],
  moduleImports: [
    'import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
    'import { of } from \'rxjs\';',
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  setup: `protected readonly tags: CngxSelectOptionDef<{ id: string; name: string }>[] = [
    { value: { id: 't1', name: 'Design' }, label: 'Design' },
    { value: { id: 't2', name: 'Development' }, label: 'Development' },
    { value: { id: 't3', name: 'QA' }, label: 'QA' },
    { value: { id: 't4', name: 'Docs' }, label: 'Docs' },
  ];
  protected readonly basicCompare = (
    a: { id: string; name: string } | undefined,
    b: { id: string; name: string } | undefined,
  ) => (a?.id ?? null) === (b?.id ?? null);
  protected readonly basicDisplay = (v: { id: string; name: string }) => v.name;
  protected readonly seededValue = signal<{ id: string; name: string } | undefined>(
    { id: 't2', name: 'Development' },
  );
  protected readonly seededLog = signal<string[]>([]);
  protected seededCounter = 0;
  protected readonly seededCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'created-' + ++this.seededCounter, name: draft.label });
  protected handleSeededCreated(opt: CngxSelectOptionDef<{ id: string; name: string }>): void {
    const ts = new Date().toLocaleTimeString();
    this.seededLog.update((l) =>
      [...l.slice(-4), ts + ' → created "' + opt.label + '" (id=' + opt.value.id + ')'],
    );
  }`,
  template: `  <cngx-action-select
    [label]="'Tag (pre-seeded)'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="seededCreate"
    [clearable]="true"
    [(value)]="seededValue"
    (created)="handleSeededCreated($event)"
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
  </cngx-action-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Current</span>
      <span class="event-value">{{ seededValue()?.name ?? '—' }}</span>
    </div>
    @for (line of seededLog(); track line) {
      <div class="event-row">
        <span class="event-label">created</span>
        <span class="event-value">{{ line }}</span>
      </div>
    }
  </div>`,
};
