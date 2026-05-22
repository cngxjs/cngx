import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled state',
  subtitle: 'When <code>[disabled]="true"</code>, click + keyboard + remove are silently short-circuited; <code>aria-disabled="true"</code> and <code>tabindex=-1</code> reflect the state.',
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
  protected readonly locked = signal(false);`,
  template: `
  <cngx-chip cngxChipInteraction [value]="'locked'" [disabled]="locked()" [(selected)]="favourite">
    Locked tag
  </cngx-chip>
  <button type="button" (click)="locked.set(!locked())">toggle disabled</button>`,
};
