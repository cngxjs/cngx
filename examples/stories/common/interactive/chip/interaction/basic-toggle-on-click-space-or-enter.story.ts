import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInteraction: Basic toggle on click, Space, or Enter',
  subtitle: 'The chip exposes <code>[(selected)]</code> as a two-way model. Click, Space, or Enter flips it; <code>aria-selected</code> reflects the state reactively.',
  description: 'Standalone interactive chip atom. Applies <code>[cngxChipInteraction]</code> onto the existing <code>&lt;cngx-chip&gt;</code> display pill and writes <code>role="option"</code>, <code>aria-selected</code>, and <code>tabindex="0"</code> on the host. Click + Space + Enter all flip the local-owned <code>[(selected)]</code> model. Provides <code>CNGX_CONTROL_VALUE</code> so <code>CngxFormBridge</code> can adapt it to Reactive Forms. Use this when a chip stands alone (filter tag, single suggestion); use <code>[cngxChipInGroup]</code> instead for chips inside a chip-group.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxChipInteraction',
    'CngxChip',
    'CNGX_CONTROL_VALUE',
  ],
  moduleImports: [
    'import { CngxChipInteraction } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipInteraction', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA 1.2: `option` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#option' },
    { label: 'WAI-ARIA 1.2: `aria-selected`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-selected' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  setup: `protected readonly favourite = signal(false);
  protected readonly featured = signal(true);`,
  template: `
  <div class="chip-strip">
    <cngx-chip cngxChipInteraction [value]="'favourite'" [(selected)]="favourite">Favourite</cngx-chip>
    <cngx-chip cngxChipInteraction [value]="'featured'" [(selected)]="featured">Featured</cngx-chip>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">favourite</span>
      <span class="event-value">{{ favourite() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">featured</span>
      <span class="event-value">{{ featured() }}</span>
    </div>
  </div>`,
};
