import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Single select',
  subtitle: 'Arrow keys navigate; Enter/Space activates. Click also selects. Disabled options are skipped in navigation and clicks.',
  description: 'Composite listbox primitive with single/multi selection, keyboard navigation, and signal-first ARIA state.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxListbox',
    'CngxOption',
  ],
  moduleImports: [
    'import { CngxListbox, CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxListbox', 'CngxOption'],
  setup: `protected readonly singleValue = signal<string | null>(null);`,
  template: `
  <div cngxListbox
       [label]="'Fruits (single)'"
       tabindex="0"
       class="ad-listbox"
       (valueChange)="singleValue.set($any($event))"
       #lbSingle="cngxListbox">
    <div cngxOption value="apple">Apple</div>
    <div cngxOption value="banana">Banana</div>
    <div cngxOption value="cherry" [disabled]="true">Cherry (disabled)</div>
    <div cngxOption value="date">Date</div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Selected</span>
      <span class="event-value">{{ singleValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Selected label</span>
      <span class="event-value">{{ lbSingle.selectedLabel() ?? '—' }}</span>
    </div>
  </div>`,
  css: `.ad-listbox {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 260px;
  padding: 4px;
  border: 1px solid var(--cngx-color-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  outline: none;
}
.ad-listbox:focus-visible {
  outline: 2px solid var(--cngx-color-primary, #4a8cff);
  outline-offset: 2px;
}
.ad-listbox [cngxOption] {
  padding: 6px 10px;
  border-radius: var(--cngx-radius-sm, 4px);
  cursor: default;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cngx-option--highlighted {
  background: var(--cngx-option-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-option--selected {
  background: var(--cngx-option-selected-bg, rgba(74, 140, 255, 0.25));
  font-weight: 600;
}
.cngx-option--selected::after {
  content: '\\2713';
  margin-left: auto;
}
.cngx-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`,
};
