import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipGroup: Basic single-select pick',
  subtitle: 'Click any chip to select it; click again to deselect. Only one chip is <code>aria-selected</code> at a time.',
  description: 'Single-select chip group molecule. Owns <code>selected = model&lt;T | undefined&gt;</code>, provides <code>CNGX_CHIP_GROUP_HOST</code> so projected <code>&lt;cngx-chip cngxChipInGroup&gt;</code> leaves derive their <code>aria-selected</code> from the parent\'s selection. Host bindings: <code>role="listbox"</code>, <code>aria-label</code>, <code>aria-disabled</code> (cascades from <code>[disabled]</code>, exercised by the toggle below), <code>aria-required</code>, <code>aria-invalid</code>, <code>aria-errormessage</code>, and <code>aria-busy</code> (driven by an optional <code>[state]</code> input). Composes <code>CngxRovingTabindex</code> for arrow-key navigation between chips; the active chip toggles via Click/Space/Enter through the in-group leaf. Single-mode behaviour: re-clicking the active chip clears the selection (toggle off). See <code>chip/in-group/keyboard-and-aria</code> for the full keyboard + ARIA teach.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: [
    'CngxChipGroup',
    'CngxChipInGroup',
    'CngxChip',
    'CNGX_CHIP_GROUP_HOST',
  ],
  moduleImports: [
    'import { CngxChipGroup, CngxChipInGroup } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChipGroup', 'CngxChipInGroup', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA APG: Listbox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/' },
    { label: 'WAI-ARIA 1.2: `listbox` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#listbox' },
    { label: 'WAI-ARIA 1.2: `aria-disabled`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled' },
  ],
  setup: `protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly size = signal<'sm' | 'md' | 'lg' | undefined>('md');`,
  setupChrome: `protected readonly groupDisabled = signal(false);`,
  template: `
  <cngx-chip-group label="T-shirt size" [(selected)]="size" [disabled]="groupDisabled()">
    @for (s of sizes; track s) {
      <cngx-chip cngxChipInGroup [value]="s">{{ s.toUpperCase() }}</cngx-chip>
    }
  </cngx-chip-group>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">picked</span>
      <span class="event-value">{{ size() ?? '(none)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">group disabled</span>
      <span class="event-value">{{ groupDisabled() }}</span>
    </div>
  </div>
  <div class="button-row" style="margin-top:12px">
    <button type="button" (click)="groupDisabled.set(!groupDisabled())">toggle group disabled</button>
  </div>`,
};
