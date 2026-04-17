import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Option',
  navLabel: 'Option',
  navCategory: 'interactive',
  description:
    'Single option directive that registers with a surrounding CngxActiveDescendant. Click highlights + activates, pointerenter highlights only.',
  apiComponents: ['CngxOption', 'CngxOptionGroup'],
  overview:
    '<p><code>[cngxOption]</code> is the smallest selectable leaf of the listbox/menu stack. ' +
    'It provides <code>CNGX_AD_ITEM</code> via DI so the enclosing <code>CngxActiveDescendant</code> ' +
    'tracks it automatically. <code>[cngxOptionGroup]</code> wraps options under a labeled ' +
    '<code>role="group"</code>.</p>',
  moduleImports: [
    "import { CngxActiveDescendant } from '@cngx/common/a11y';",
    "import { CngxOption, CngxOptionGroup } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly lastActivated = signal<string | null>(null);
  `,
  sections: [
    {
      title: 'Flat options with AD',
      subtitle:
        'Arrow keys navigate. Enter/Space or click activates. Pointerenter follows the mouse without firing the activation output.',
      imports: ['CngxActiveDescendant', 'CngxOption'],
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
  border: 1px solid var(--cngx-surface-border, #d0d5dd);
  border-radius: var(--cngx-radius-md, 8px);
  outline: none;
}
.ad-listbox:focus-visible {
  outline: 2px solid var(--cngx-focus-ring, #4a8cff);
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
    },
    {
      title: 'Grouped options',
      subtitle:
        '<code>[cngxOptionGroup]</code> wraps options under a labeled <code>role="group"</code>. Navigation stays flat — groups are presentational only.',
      imports: ['CngxActiveDescendant', 'CngxOption', 'CngxOptionGroup'],
      template: `
  <div class="ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Grouped options"
       tabindex="0"
       #adGrouped="cngxActiveDescendant">
    <div cngxOptionGroup [label]="'Fruits'">
      <div cngxOption value="apple">Apple</div>
      <div cngxOption value="banana">Banana</div>
    </div>
    <div cngxOptionGroup [label]="'Vegetables'">
      <div cngxOption value="carrot">Carrot</div>
      <div cngxOption value="daikon">Daikon</div>
    </div>
  </div>`,
    },
  ],
};
