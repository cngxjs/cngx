import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — toggle on click, Space, or Enter',
  subtitle: 'The chip exposes <code>[(selected)]</code> as a two-way model. Click, Space, or Enter flips it; ARIA <code>aria-selected</code> reflects the state reactively.',
  description: 'Standalone interactive chip atom — applies <code>[cngxChipInteraction]</code> onto the existing <code>&lt;cngx-chip&gt;</code> display pill and adds <code>role="option"</code> selection semantics with a local-owned <code>selected</code> model. Provides <code>CNGX_CONTROL_VALUE</code> so <code>CngxFormBridge</code> can adapt it to Reactive Forms. Use this when a chip stands alone (filter tag, single suggestion); use <code>[cngxChipInGroup]</code> instead for chips inside a chip-group.',
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
  setup: `protected readonly favourite = signal(false);
  protected readonly featured = signal(true);`,
  template: `
  <cngx-chip cngxChipInteraction [value]="'favourite'" [(selected)]="favourite">Favourite</cngx-chip>
  <cngx-chip cngxChipInteraction [value]="'featured'" [(selected)]="featured">Featured</cngx-chip>
  <p class="caption">favourite: <code>{{ favourite() }}</code> • featured: <code>{{ featured() }}</code></p>`,
};
