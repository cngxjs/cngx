import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: custom action template split actions',
  subtitle: 'The action slot is just an <code>ng-template</code> with a rich context - project anything: a split button with both <em>Create &amp; close</em> and <em>Create &amp; keep open</em>, keyboard shortcuts, icons, mini-wizards. The component\'s <code>closeOnCreate</code> input is the default; consumer templates can call <code>close()</code> from the context to force-close after an <code>onCreated</code> emit.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxActionSelect',
    'CngxSelectAction',
  ],
  moduleImports: [
    'import { CngxActionSelect, type CngxSelectCreateAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { CngxSelectAction } from \'@cngx/forms/select\';',
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
  protected readonly customValue = signal<{ id: string; name: string } | undefined>(undefined);
  protected customCounter = 0;
  protected readonly customCreate: CngxSelectCreateAction<{ id: string; name: string }> =
    (_term, draft) => ({ id: 'custom-' + ++this.customCounter, name: draft.label });`,
  template: `  <cngx-action-select
    [label]="'Custom'"
    [options]="tags"
    [compareWith]="basicCompare"
    [displayWith]="basicDisplay"
    [quickCreateAction]="customCreate"
    [closeOnCreate]="false"
    [clearable]="true"
    [(value)]="customValue"
    actionPosition="top"
  >
    <ng-template
      cngxSelectAction
      let-term
      let-commit="commit"
      let-pending="isPending"
      let-close="close"
    >
      <div style="
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: .5rem .75rem;
        border-bottom: 1px solid var(--cngx-color-border, #e5e7eb);
        background: var(--cngx-surface-variant, rgba(0,0,0,.02));
      ">
        <span class="demo-split-action-glyph" aria-hidden="true">✨</span>
        <span class="demo-split-action-heading">
          New tag @if (term) { · "{{ term }}" }
        </span>
        <button
          type="button"
          [disabled]="!term || pending"
          (click)="commit()"
          class="demo-select-retry-button"
        >
          create
        </button>
        <button
          type="button"
          [disabled]="!term || pending"
          (click)="commit(); close()"
          class="demo-mini-form-btn demo-mini-form-btn--primary"
        >
          create &amp; close
        </button>
      </div>
    </ng-template>
  </cngx-action-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Custom</span>
      <span class="event-value">{{ customValue()?.name ?? '—' }}</span>
    </div>
  </div>`,
};
