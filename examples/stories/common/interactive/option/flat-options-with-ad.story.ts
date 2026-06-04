import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOption: Flat options with active-descendant',
  subtitle: 'Arrow keys navigate. Enter/Space or click activates. Pointerenter highlights without firing the activation output.',
  description: 'Single option directive that registers with a surrounding CngxActiveDescendant. Each option exposes a stable unique id (always in DOM) so the AD container can reference it via aria-activedescendant; click highlights + activates, pointerenter highlights only. The container holds focus throughout - options never receive DOM focus (active-descendant variant of the WAI-ARIA listbox pattern).',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxOption',
  ],
  references: [
    { label: 'WAI-ARIA APG: Listbox', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/listbox/' },
    { label: 'WCAG 2.4.3 Focus Order', href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html' },
  ],
  moduleImports: [
    'import { CngxActiveDescendant } from \'@cngx/common/a11y\';',
    'import { CngxOption } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxActiveDescendant', 'CngxOption'],
  setup: `protected readonly lastActivated = signal<string | null>(null);`,
  template: `  <div class="demo-ad-listbox"
       cngxActiveDescendant
       role="listbox"
       aria-label="Flat options"
       tabindex="0"
       (activated)="lastActivated.set($any($event))"
       #adFlat="cngxActiveDescendant">
    <div cngxOption value="paste">Paste</div>
    <div cngxOption value="paste-special">Paste Special</div>
    <div cngxOption value="paste-values" [disabled]="true">Paste Values (disabled)</div>
    <div cngxOption value="paste-formatting">Paste Formatting</div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active value</span>
      <span class="event-value">{{ adFlat.activeValue() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last activated</span>
      <span class="event-value">{{ lastActivated() ?? '-' }}</span>
    </div>
  </div>`,
};
