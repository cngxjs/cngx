import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiSelect: multi chip overflow scroll',
  subtitle:
    '<code>chipOverflow="scroll-x"</code> keeps every chip on one row and scrolls the strip sideways once the chips outgrow the trigger. Drag the width slider to make the row overflow.',
  description:
    'Unlike <code>"fit"</code> and <code>"truncate"</code>, nothing folds into a badge: every chip stays rendered, focusable and removable, and the trigger never grows taller. Set it per instance or app-wide with <code>provideSelectConfig(withChipOverflow(\'scroll-x\'))</code>. Pick it when every selected value must stay one tab stop away; pick <code>"fit"</code> when the trigger should show a count instead of a scrollbar.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'programmatic',
  apiComponents: ['CngxMultiSelect'],
  moduleImports: ["import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';"],
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
  chipOverflow="scroll-x"
  [style.max-width.px]="width()"
  placeholder="Choose people…"
/>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      Width {{ width() }}px
      <input type="range" min="200" max="800" step="10" [value]="width()" (input)="width.set(+$any($event.target).value)" />
    </label>
  </div>
  <div class="event-grid">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ team().length }}</span></div>
  </div>`,
};
