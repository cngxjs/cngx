import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: default commit-error surface via withCommitErrorDisplay',
  subtitle:
    "<code>provideSelectConfigAt(withCommitErrorDisplay('inline'))</code> sets the default <code>[commitAction]</code> error surface for the subtree. This select carries no per-instance <code>commitErrorDisplay</code>, so a rejected commit surfaces as the per-row inline badge instead of the default banner. A per-instance input still wins.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withCommitErrorDisplay, type CngxSelectCommitAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ["...provideSelectConfigAt(withCommitErrorDisplay('inline'))"],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly value = signal<string | undefined>('red');
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    if (this.failNext()) {
      return throwError(() => new Error('Server offline')).pipe(delay(600));
    }
    return of(intended).pipe(delay(600));
  };`,
  setupChrome: `protected readonly failNext = signal(true);`,
  templateChromeBefore: `<p class="demo-hint">Fail next is on. Pick a different colour and the rejected commit paints the inline per-row badge, not the banner.</p>`,
  template: `<cngx-select
  [label]="'Colour (commit)'"
  [options]="colors"
  [commitAction]="commitAction"
  [commitMode]="'pessimistic'"
  [(value)]="value"
/>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="failNext.set(!failNext())">
      {{ failNext() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
    <span class="event-value" style="margin-inline-start:8px">Value: {{ value() ?? '-' }}</span>
  </div>`,
};
