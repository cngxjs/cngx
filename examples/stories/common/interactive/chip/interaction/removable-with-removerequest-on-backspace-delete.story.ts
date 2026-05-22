import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Removable with (removeRequest) on Backspace / Delete',
  subtitle: 'Backspace and Delete fire the <code>(removeRequest)</code> output — the consumer decides what removal means. Click on the chip body still toggles selection; click on the close button fires <code>(remove)</code> from <code>&lt;cngx-chip&gt;</code> (no double-toggle).',
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
  protected readonly tagRemoved = signal(0);`,
  template: `
  <cngx-chip
    cngxChipInteraction
    [value]="'tag'"
    [(selected)]="favourite"
    [removable]="true"
    (removeRequest)="tagRemoved.set(tagRemoved() + 1)"
    (remove)="tagRemoved.set(tagRemoved() + 1)"
  >Removable tag</cngx-chip>
  <p class="caption">remove fired: <code>{{ tagRemoved() }}</code></p>`,
};
