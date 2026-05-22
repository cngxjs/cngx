import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInGroup: Keyboard and ARIA',
  subtitle: 'Applies <code>role="option"</code> + <code>aria-selected</code> on every <code>&lt;cngx-chip&gt;</code> and wires Click / Space / Enter to <code>parent.toggle</code>, Delete / Backspace to <code>parent.remove</code>.',
  description: '<code>CngxChipInGroup</code> turns a presentational <code>&lt;cngx-chip&gt;</code> into a <code>role="option"</code> leaf of its surrounding chip-group. Host bindings: <code>role="option"</code>, <code>aria-selected</code> (derived from <code>parent.isSelected(value())</code>), <code>aria-disabled</code> (true when the group cascades <code>[disabled]</code> or the chip itself sets <code>[disabled]</code>), and <code>aria-describedby</code> (from <code>[cngxDescribedBy]</code>). Keyboard handlers: <code>(click)</code> + <code>(keydown.space)</code> + <code>(keydown.enter)</code> call <code>parent.toggle(value())</code>; <code>(keydown.delete)</code> + <code>(keydown.backspace)</code> call <code>parent.remove(value())</code>. Composes <code>CngxRovingItem</code> as a host directive so arrow-key navigation driven by the parent\'s <code>CngxRovingTabindex</code> skips per-chip-disabled leaves automatically. The chip never holds its own selection state: <code>selected</code> is a <code>computed()</code> reading the parent, and a click on the bubbled close-button is filtered so the chip toggle does not double-fire. Without a parent <code>&lt;cngx-chip-group&gt;</code> the directive throws <code>NullInjectorError</code> at construction by design; use <code>[cngxChipInteraction]</code> for standalone chips instead. The third chip below is per-chip disabled and uses <code>[cngxDescribedBy]</code> to point at a visible reason span so screen-reader users hear why the option cannot be picked.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxChipInGroup',
    'CngxChipGroup',
    'CngxChip',
  ],
  moduleImports: [
    'import { CngxChipGroup, CngxChipInGroup } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipGroup', 'CngxChipInGroup', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA APG: Listbox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/' },
    { label: 'WAI-ARIA 1.2: `option` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#option' },
    { label: 'WAI-ARIA 1.2: `aria-selected`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-selected' },
    { label: 'WAI-ARIA 1.2: `aria-describedby`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-describedby' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  setup: `
  protected readonly sizes = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large', disabled: true, reason: 'lg-out-of-stock' },
    { value: 'xl', label: 'X-Large' },
  ] as const;
  protected readonly size = signal<'sm' | 'md' | 'lg' | 'xl' | undefined>('md');`,
  template: `
  <cngx-chip-group label="T-shirt size" [(selected)]="size">
    @for (s of sizes; track s.value) {
      <cngx-chip
        cngxChipInGroup
        [value]="s.value"
        [disabled]="!!s.disabled"
        [cngxDescribedBy]="s.reason ?? null"
      >{{ s.label }}</cngx-chip>
    }
  </cngx-chip-group>
  <p id="lg-out-of-stock" style="margin-top:8px">Large is out of stock until next week.</p>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Tab into the group, then use Arrow keys to move between chips, Space or Enter to toggle, Delete or Backspace to remove. The disabled chip is skipped by activation but still receives focus.</p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">selected</span>
      <span class="event-value">{{ size() ?? '(none)' }}</span>
    </div>
  </div>`,
};
