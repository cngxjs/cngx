import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Combobox — per-toggle [commitAction]',
  subtitle: 'Every toggle (option click, chip ×, Backspace-on-empty, clear-all) routes through an async write with optimistic/pessimistic supersede semantics — same wiring as the multi-select producer.',
  description: 'CngxCombobox — tag-input filter with live typeahead. Multi-value tag strip + free-text filtering, plus the same async/commit machinery as CngxSelect.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern', 'composition'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxCombobox',
    'CngxComboboxChip',
    'CngxComboboxTriggerLabel',
  ],
  moduleImports: [
    'import { CngxCombobox, type CngxSelectCommitAction, type CngxSelectOptionDef } from \'@cngx/forms/select\';',
    'import { delay, of, throwError } from \'rxjs\';',
  ],
  imports: ['CngxCombobox'],
  setup: `protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitShouldFail = signal(false);
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.commitLog.update(l => [...l, ts + ' → commit(' + String(intended) + ')']);
    if (this.commitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };
  protected readonly tagOptions: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'Accessibility' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'old', label: 'Nicht mehr gepflegt', disabled: true },
  ];
  protected readonly comboCommitValues = signal<string[]>(['angular']);
  protected readonly comboCommitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly comboCommitShouldFail = signal(false);
  protected readonly comboCommitLog = signal<string[]>([]);
  protected readonly comboCommitAction: CngxSelectCommitAction<string[]> = (intended) => {
    const ts = new Date().toLocaleTimeString();
    this.comboCommitLog.update(l => [...l, ts + ' → commit([' + (intended ?? []).join(',') + '])']);
    if (this.comboCommitShouldFail()) {
      return throwError(() => new Error('Server offline')).pipe(delay(800));
    }
    return of(intended).pipe(delay(800));
  };`,
  template: `
  <div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px">
    <button type="button" class="chip"
            [style.background]="comboCommitMode() === 'optimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="comboCommitMode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [style.background]="comboCommitMode() === 'pessimistic' ? 'color-mix(in oklch, var(--cngx-color-success) 18%, transparent)' : ''"
            (click)="comboCommitMode.set('pessimistic')">pessimistic</button>
    <label style="margin-inline-start:12px">
      <input type="checkbox"
             [checked]="comboCommitShouldFail()"
             (change)="comboCommitShouldFail.set($any($event.target).checked)" />
      simulate error
    </label>
  </div>
  <cngx-combobox
    [label]="'Topics (commit)'"
    [options]="tagOptions"
    [(values)]="comboCommitValues"
    [commitAction]="comboCommitAction"
    [commitMode]="comboCommitMode()"
    placeholder="Search topics…"
  />
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Values</span><span class="event-value">{{ comboCommitValues().join(', ') || '—' }}</span></div>
    <div class="event-row"><span class="event-label">Commit log</span>
      <span class="event-value" style="white-space:pre">{{ comboCommitLog().slice(-4).join('\\n') || '—' }}</span>
    </div>
  </div>`,
};
