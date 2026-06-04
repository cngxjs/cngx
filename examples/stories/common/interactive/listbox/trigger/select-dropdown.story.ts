import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxListboxTrigger: select dropdown',
  subtitle:
    'Closed: Down/Enter/Space opens and highlights the first option, Up opens and highlights the last. Open: arrows, Home, End navigate; Enter/Space activates and closes; Escape closes. Focus stays on the trigger throughout.',
  description:
    'Button-with-listbox-popup composition: CngxListboxTrigger owns the keyboard model, CngxPopover owns the open/close state and dialog-style focus return, CngxPopoverTrigger wires aria-haspopup="listbox" and aria-controls onto the trigger.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Select-Only Combobox',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/',
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
  apiComponents: [
    'CngxListboxTrigger',
    'CngxListbox',
    'CngxOption',
    'CngxPopover',
  ],
  moduleImports: [
    "import { CngxListbox, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxListbox',
    'CngxListboxTrigger',
    'CngxOption',
    'CngxPopover',
    'CngxPopoverTrigger',
  ],
  setup: `protected readonly selectedColor = signal<string | null>(null);`,
  template: `  <button
    type="button"
    class="demo-listbox-trigger"
    [cngxListboxTrigger]="lb"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'listbox'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxListboxTrigger"
  >
    <span>{{ lb.selectedLabel() ?? 'Choose a color' }}</span>
  </button>
  <div cngxPopover #pop="cngxPopover">
    <div
      cngxListbox
      [label]="'Color'"
      tabindex="0"
      (valueChange)="selectedColor.set($any($event))"
      #lb="cngxListbox"
    >
      <div cngxOption value="red">Red</div>
      <div cngxOption value="green">Green</div>
      <div cngxOption value="blue">Blue</div>
      <div cngxOption value="orange">Orange</div>
      <div cngxOption value="purple">Purple</div>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ selectedColor() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
