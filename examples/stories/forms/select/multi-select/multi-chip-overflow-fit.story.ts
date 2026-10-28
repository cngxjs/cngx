import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi chip overflow fit',
  subtitle:
    '<code>chipOverflow="fit"</code> keeps the trigger on one row and shows as many chips as the trigger holds; the rest fold into the <code>+N</code> badge. Drag the width slider to watch the count follow.',
  description:
    'The select measures its own chip strip, so there is no <code>[maxVisibleChips]</code> to guess per width. Chips past the fit stay out of the tab order and are hidden from AT; the whole selection is read through the control. The space kept for the badge is <code>--cngx-select-chip-fit-badge-reserve</code> (default <code>4ch</code>): set it on the select, a container or <code>:root</code> for a wider projected badge. A label longer than the trigger ellipsizes inside its chip.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'programmatic',
  apiComponents: ['CngxMultiSelect'],
  moduleImports: [
    "import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
    "import { afterEveryRender } from '@angular/core';",
  ],
  imports: ['CngxMultiSelect'],
  setup: `protected readonly teamOptions: CngxSelectOptionDef<string>[] = [
  { value: 'ops', label: 'Operations lead' },
  { value: 'cs', label: 'Customer success' },
  { value: 'fin', label: 'Finance controller' },
  { value: 'plat', label: 'Platform engineer' },
  { value: 'data', label: 'Data steward' },
  { value: 'sec', label: 'Security officer' },
];
protected readonly team = signal<string[]>(['ops', 'cs', 'fin', 'plat', 'data']);
protected readonly width = signal(360);`,
  template: `<cngx-multi-select
  [label]="'Team'"
  [options]="teamOptions"
  [(values)]="team"
  chipOverflow="fit"
  [style.max-width.px]="width()"
  placeholder="Choose people…"
/>`,
  setupChrome: `private readonly demoHost = inject(ElementRef<HTMLElement>);
protected readonly visibleChips = signal(0);
private readonly countVisible = afterEveryRender({
  read: () =>
    this.visibleChips.set(
      this.demoHost.nativeElement.querySelectorAll('.cngx-select__chip-slot:not([inert])').length,
    ),
});`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      Width {{ width() }}px
      <input type="range" min="200" max="800" step="10" [value]="width()" (input)="width.set(+$any($event.target).value)" />
    </label>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ team().length }}</span></div>
    <div class="event-row"><span class="event-label">Visible</span><span class="event-value">{{ visibleChips() }}</span></div>
  </div>`,
};
