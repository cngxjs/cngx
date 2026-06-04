import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMultiChipGroup: Multi-select with selection count',
  subtitle: 'Independent toggle per chip. <code>selectedCount</code> is exposed on the group for label hints. Multi-select uses <code>createSelectionController</code> with structural-equality membership tracking.',
  description: 'Multi-select chip group molecule. Owns <code>selectedValues = model&lt;T[]&gt;</code>, provides <code>CNGX_CHIP_GROUP_HOST</code> with multi-select semantics, and uses <code>createSelectionController</code> internally for structural-equality membership tracking. Host bindings: <code>role="listbox"</code> + <code>aria-multiselectable="true"</code>, plus <code>aria-label</code>, <code>aria-disabled</code> (cascades to projected leaves via the host token), <code>aria-required</code>, <code>aria-invalid</code>, <code>aria-errormessage</code>, and <code>aria-busy</code> (driven by an optional <code>[state]</code> input). Projected <code>&lt;cngx-chip cngxChipInGroup&gt;</code> leaves render their own <code>role="option"</code> + <code>aria-selected</code>; the group composes <code>CngxRovingTabindex</code> so arrow keys move between them and Click/Space/Enter toggle membership independently. Use <code>[keyFn]</code> for object-valued options where reference equality is unstable.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxMultiChipGroup',
    'CngxChipInGroup',
    'CngxChip',
    'CNGX_CHIP_GROUP_HOST',
  ],
  moduleImports: [
    'import { CngxMultiChipGroup, CngxChipInGroup } from \'@cngx/common/interactive\';',
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxMultiChipGroup', 'CngxChipInGroup', 'CngxChip'],
  references: [
    { label: 'WAI-ARIA APG: Listbox pattern (multi-select)', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/' },
    { label: 'WAI-ARIA 1.2: `listbox` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#listbox' },
    { label: 'WAI-ARIA 1.2: `aria-multiselectable`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-multiselectable' },
  ],
  setup: `protected readonly tags = ['urgent', 'review', 'blocker', 'follow-up', 'on-hold'] as const;
  protected readonly picked = signal<string[]>(['urgent', 'review']);`,
  template: `
  <cngx-multi-chip-group #group="cngxMultiChipGroup" label="Tags" [(selectedValues)]="picked">
    @for (tag of tags; track tag) {
      <cngx-chip cngxChipInGroup [value]="tag">{{ tag }}</cngx-chip>
    }
  </cngx-multi-chip-group>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">group.selectedCount()</span>
      <span class="event-value">{{ group.selectedCount() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">selected values</span>
      <span class="event-value">{{ picked().join(', ') || '(none)' }}</span>
    </div>
  </div>`,
};
