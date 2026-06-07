import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: panel render modes',
  subtitle:
    'Switch the render mode, type into a field, move to the other tab, then come back. <strong>lazy</strong> keep-alives the panel DOM so your text survives; <strong>lazy-destroy</strong> tears the panel content down so the field returns empty; <strong>eager</strong> renders every panel up front. The panel element itself always stays in the DOM (the <code>aria-controls</code> target).',
  description:
    'Panel-mode axis: <code>eager</code> (default, byte-identical to before the input existed) / <code>lazy</code> (keep-alive after first activation) / <code>lazy-destroy</code> (only the active panel renders content). The inputs are deliberately uncontrolled - their surviving (or reset) text is the honest proof of keep-alive vs destroy; a component-signal readout would falsely retain the value after destroy. The keep-alive set is a derived <code>linkedSignal</code> over the active id, not an <code>effect</code> that writes a set.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly mode = signal<'eager' | 'lazy' | 'lazy-destroy'>('lazy');
  protected readonly modes = ['eager', 'lazy', 'lazy-destroy'] as const;`,
  template: `  <cngx-tab-group [panelMode]="mode()" [(activeIndex)]="active" aria-label="Panel render modes">
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent>
        <label>Display name
          <input type="text" placeholder="Type here, then switch tabs and come back" />
        </label>
      </ng-template>
    </div>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent>
        <label>Email
          <input type="email" placeholder="Type here, then switch tabs and come back" />
        </label>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Panel render mode" style="margin-top:12px;gap:12px">
    @for (m of modes; track m) {
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-tab-panel-mode"
               [checked]="mode() === m"
               (change)="mode.set(m)" />
        {{ m }}
      </label>
    }
  </div>`,
};
