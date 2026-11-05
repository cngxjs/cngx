import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: commit-error announce policy via withCommitErrorAnnouncePolicy',
  subtitle:
    "<code>provideSelectConfigAt(withCommitErrorAnnouncePolicy({ kind: 'verbose', severity: 'assertive' }))</code> forces how a rejected commit is spoken for the subtree. With <code>commitErrorDisplay=\"none\"</code> there is no visual surface, so the assertive announcement is the only feedback. A per-instance <code>[commitErrorAnnouncePolicy]</code> still wins; <code>null</code> restores each variant's baseline.",
  description:
    "The result here is spoken, not shown. The <code>verbose</code> policy speaks the full error message; <code>assertive</code> interrupts the screen reader at once rather than waiting for a pause. Turn on a screen reader, keep <em>Fail next</em> on, and pick a different colour to hear it.",
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'error-handling', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withCommitErrorAnnouncePolicy, type CngxSelectCommitAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  imports: ['CngxSelect'],
  viewProviders: [
    "...provideSelectConfigAt(withCommitErrorAnnouncePolicy({ kind: 'verbose', severity: 'assertive' }))",
  ],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly value = signal<string | undefined>('red');
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) => {
    if (this.failNext()) {
      return throwError(() => new Error('Could not save the colour')).pipe(delay(600));
    }
    return of(intended).pipe(delay(600));
  };`,
  setupChrome: `protected readonly failNext = signal(true);`,
  template: `<cngx-select
  [label]="'Colour (commit)'"
  [options]="colors"
  [commitAction]="commitAction"
  [commitMode]="'optimistic'"
  commitErrorDisplay="none"
  [(value)]="value"
/>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="failNext.set(!failNext())">
      {{ failNext() ? 'Fail next: ON' : 'Fail next: off' }}
    </button>
    <span class="event-value" style="margin-inline-start:8px">Value: {{ value() ?? '-' }}</span>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>on a rejected commit</dt>
      <dd>the full error text, spoken assertively ("Could not save the colour")</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      Nothing is shown in the panel: commitErrorDisplay is none, so the assertive announcement is the only feedback.
    </p>
  </div>`,
};
