import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Listbox Trigger',
  navLabel: 'ListboxTrigger',
  navCategory: 'interactive',
  description:
    'Dropdown select composed from CngxListboxTrigger + CngxPopover + CngxListbox. Full keyboard model (open/close, navigate, activate, focus return).',
  apiComponents: ['CngxListboxTrigger', 'CngxListbox', 'CngxOption', 'CngxPopover'],
  overview:
    '<p><code>[cngxListboxTrigger]</code> wires a button to a listbox wrapped in a popover. ' +
    'Keyboard: ArrowDown opens and highlights first; ArrowUp opens and highlights last; ' +
    'Escape closes and restores focus; Enter selects and closes (default <code>closeOnSelect=true</code>).</p>',
  moduleImports: [
    "import { CngxListbox, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  setup: `
  protected readonly selectedColor = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Select dropdown',
      subtitle:
        'Click or press ArrowDown to open. Enter / click on an option to select and close.',
      imports: ['CngxListbox', 'CngxListboxTrigger', 'CngxOption', 'CngxPopover', 'CngxPopoverTrigger'],
      template: `
  <button
    type="button"
    class="trigger"
    [cngxListboxTrigger]="lb"
    [cngxPopoverTrigger]="pop"
    [haspopup]="'listbox'"
    [popover]="pop"
    (click)="pop.toggle()"
    #trigger="cngxListboxTrigger"
  >
    {{ lb.selectedLabel() ?? 'Choose a color' }}
  </button>
  <div cngxPopover #pop="cngxPopover" class="pop">
    <div
      cngxListbox
      class="ad-listbox"
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
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ selectedColor() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Open</span>
      <span class="event-value">{{ trigger.isOpen() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
      css: `.trigger {
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 6px);
  background: var(--cngx-surface-default, #fff);
  text-align: left;
  cursor: pointer;
  font: inherit;
}
.trigger:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
  outline-offset: 2px;
}
.pop {
  margin-top: 4px;
  padding: 4px;
  min-width: 200px;
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 6px);
  background: var(--cngx-surface-default, #fff);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.ad-listbox {
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ad-listbox [cngxOption] {
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.cngx-option--highlighted {
  background: var(--cngx-option-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-option--selected {
  font-weight: 600;
}`,
    },
  ],
};
