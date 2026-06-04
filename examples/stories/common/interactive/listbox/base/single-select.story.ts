import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListbox: single select',
  subtitle:
    'ArrowUp/Down navigate, Home/End jump, Enter or Space activates, printable keys typeahead. Click also selects. Disabled options are skipped in both keyboard and click paths.',
  description:
    'Single-value listbox: the host carries focus while aria-activedescendant points at the highlighted option, and the activated value is written back through the value model binding.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA APG: Listbox pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
    },
  ],
  apiComponents: ['CngxListbox', 'CngxOption'],
  moduleImports: [
    "import { CngxListbox, CngxOption } from '@cngx/common/interactive';",
  ],
  imports: ['CngxListbox', 'CngxOption'],
  setup: `protected readonly singleValue = signal<string | null>(null);`,
  template: `  <div cngxListbox
       [label]="'Fruits (single)'"
       tabindex="0"
       class="demo-listbox-surface"
       (valueChange)="singleValue.set($any($event))"
       #lbSingle="cngxListbox">
    <div cngxOption value="apple">Apple</div>
    <div cngxOption value="banana">Banana</div>
    <div cngxOption value="cherry" [disabled]="true">Cherry (disabled)</div>
    <div cngxOption value="date">Date</div>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ singleValue() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Selected label</span>
      <span class="event-value">{{ lbSingle.selectedLabel() ?? '-' }}</span>
    </div>
  </div>`,
};
