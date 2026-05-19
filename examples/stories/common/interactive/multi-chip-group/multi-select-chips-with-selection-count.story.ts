import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi-select chips with selection count',
  subtitle: 'Independent toggle per chip. <code>selectedCount</code> is exposed on the group for label hints. Multi-select uses <code>createSelectionController</code> with structural-equality membership tracking.',
  description: 'Multi-select chip group molecule. Owns <code>selectedValues = model&lt;T[]&gt;</code>, provides <code>CNGX_CHIP_GROUP_HOST</code> with multi-select semantics, and uses <code>createSelectionController</code> internally for membership tracking. Renders <code>role="listbox" aria-multiselectable="true"</code>; chips toggle independently. Use <code>[keyFn]</code> for object-valued options where reference equality is unstable.',
  level: 'molecule',
  audience: ['dev', 'design'],
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
  setup: `protected readonly tags = ['urgent', 'review', 'blocker', 'follow-up', 'on-hold'] as const;
  protected readonly picked = signal<string[]>(['urgent', 'review']);`,
  template: `
  <cngx-multi-chip-group #group="cngxMultiChipGroup" label="Tags" [(selectedValues)]="picked">
    @for (tag of tags; track tag) {
      <cngx-chip cngxChipInGroup [value]="tag">{{ tag }}</cngx-chip>
    }
  </cngx-multi-chip-group>
  <p class="caption">
    selected (<code>{{ group.selectedCount() }}</code>):
    <code>{{ picked().join(', ') || '(none)' }}</code>
  </p>`,
};
