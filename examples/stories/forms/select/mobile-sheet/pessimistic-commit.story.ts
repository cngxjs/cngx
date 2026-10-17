import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Select family: pessimistic commit in the sheet',
  subtitle:
    'While a pessimistic <code>[commitAction]</code> is pending the sheet cannot be closed: X and Done are <code>aria-disabled</code>, and swipe, outside tap, Escape and the Android back gesture are ignored.',
  description:
    'Pick a city: the panel stays open with a spinner on the row until the write resolves, then closes on success. Tick "simulate error" to keep the sheet open with the error, spoken assertively from inside the sheet. The delay is long enough to try every close gesture while the commit is pending.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, type CngxSelectCommitAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { delay, of, throwError } from 'rxjs';",
  ],
  imports: ['CngxSelect'],
  setup: `protected readonly cities: CngxSelectOptionDef<string>[] = [
    { value: 'oslo', label: 'Oslo' },
    { value: 'rome', label: 'Rome' },
    { value: 'vienna', label: 'Vienna' },
  ];
  protected readonly city = signal<string | undefined>(undefined);
  protected readonly delayMs = signal(4000);
  protected readonly shouldFail = signal(false);
  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) =>
    this.shouldFail()
      ? throwError(() => new Error('Server offline')).pipe(delay(this.delayMs()))
      : of(intended).pipe(delay(this.delayMs()));`,
  template: `<div style="max-inline-size: 24rem">
    <cngx-select
      label="Delivery city"
      [options]="cities"
      [commitAction]="commitAction"
      commitMode="pessimistic"
      presentation="sheet"
      [(value)]="city"
    />
  </div>`,
  templateChrome: `<div class="button-row">
    <label>
      <input type="checkbox" [checked]="shouldFail()" (change)="shouldFail.set(!shouldFail())" />
      simulate error
    </label>
    <label>
      delay (ms)
      <input type="number" min="500" step="500" [value]="delayMs()" (change)="delayMs.set(+$any($event.target).value)" />
    </label>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">value</span>
      <span class="event-value">{{ city() ?? 'none' }}</span>
    </div>
  </div>`,
};
