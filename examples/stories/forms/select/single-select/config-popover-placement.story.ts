import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSelect: default popover placement via withPopoverPlacement',
  subtitle:
    "<code>provideSelectConfigAt(withPopoverPlacement('top'))</code> sets the default panel placement for every flat select in the subtree, so this select opens its panel above the trigger without a per-instance <code>[popoverPlacement]</code>. A per-instance input still wins; action organisms use <code>withActionPopoverPlacement</code> instead.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxSelect'],
  moduleImports: [
    "import { CngxSelect, provideSelectConfigAt, withPopoverPlacement, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxSelect'],
  viewProviders: ["...provideSelectConfigAt(withPopoverPlacement('top'))"],
  setup: `protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly colour = signal<string | undefined>(undefined);
  protected readonly open = signal(false);`,
  templateChromeBefore: `<p class="demo-hint">Scoped config places the panel above the trigger. Open the select to see it flip upward.</p>`,
  template: `<cngx-select
  [label]="'Colour'"
  [options]="colors"
  [(value)]="colour"
  (openedChange)="open.set($event)"
  placeholder="Pick a colour…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">{{ open() ? 'open (above the trigger)' : 'closed' }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ colour() ?? '-' }}</span></div>
  </div>`,
};
