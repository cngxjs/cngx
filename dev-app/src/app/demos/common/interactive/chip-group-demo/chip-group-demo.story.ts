import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Chip group (single-select)',
  navLabel: 'Chip group',
  navCategory: 'interactive',
  description:
    'Single-select chip group molecule. Owns <code>selected = model&lt;T | undefined&gt;</code>, ' +
    'provides <code>CNGX_CHIP_GROUP_HOST</code> so projected <code>&lt;cngx-chip cngxChipInGroup&gt;</code> ' +
    'leaves derive their <code>aria-selected</code> from the parent\'s selection. Renders ' +
    '<code>role="listbox"</code>; composes <code>CngxRovingTabindex</code> for arrow-key navigation. ' +
    'Single-mode behaviour: re-clicking the active chip clears the selection (toggle off).',
  apiComponents: ['CngxChipGroup', 'CngxChipInGroup', 'CngxChip', 'CNGX_CHIP_GROUP_HOST'],
  moduleImports: [
    "import { CngxChipGroup, CngxChipInGroup } from '@cngx/common/interactive';",
    "import { CngxChip } from '@cngx/common/display';",
  ],
  setup: `
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly size = signal<'sm' | 'md' | 'lg' | undefined>('md');
  protected readonly groupDisabled = signal(false);
  `,
  sections: [
    {
      title: 'Basic — pick exactly one size',
      subtitle:
        'Click any chip to select it; click again to deselect. Only one chip is ' +
        '<code>aria-selected</code> at a time.',
      imports: ['CngxChipGroup', 'CngxChipInGroup', 'CngxChip'],
      template: `
  <cngx-chip-group label="T-shirt size" [(selected)]="size" [disabled]="groupDisabled()">
    @for (s of sizes; track s) {
      <cngx-chip cngxChipInGroup [value]="s">{{ s.toUpperCase() }}</cngx-chip>
    }
  </cngx-chip-group>
  <p class="caption">picked: <code>{{ size() ?? '(none)' }}</code></p>
  <button type="button" (click)="groupDisabled.set(!groupDisabled())">toggle group disabled</button>`,
    },
  ],
};
