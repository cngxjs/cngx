import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Flat options with AD',
  subtitle: 'Arrow keys navigate. Enter/Space or click activates. Pointerenter follows the mouse without firing the activation output.',
  description: 'Single option directive that registers with a surrounding CngxActiveDescendant. Click highlights + activates, pointerenter highlights only.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: [
    'CngxOption',
    'CngxOptionGroup',
  ],
  moduleImports: [
    'import { CngxActiveDescendant } from \'@cngx/common/a11y\';',
    'import { CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxActiveDescendant', 'CngxOption'],
  setup: `protected readonly lastActivated = signal<string | null>(null);`,
  template: `
  <div class="ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Flat options"
       tabindex="0"
       (activated)="lastActivated.set($any($event))"
       #adFlat="cngxActiveDescendant">
    <div cngxOption value="paste">Paste</div>
    <div cngxOption value="paste-special">Paste Special</div>
    <div cngxOption value="paste-values" [disabled]="true">Paste Values (disabled)</div>
    <div cngxOption value="paste-formatting">Paste Formatting</div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active value</span>
      <span class="event-value">{{ adFlat.activeValue() ?? '—' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last activated</span>
      <span class="event-value">{{ lastActivated() ?? '—' }}</span>
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
}
.cngx-option--highlighted {
  background: var(--cngx-option-highlight-bg, rgba(74, 140, 255, 0.15));
}
.cngx-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`,
};
