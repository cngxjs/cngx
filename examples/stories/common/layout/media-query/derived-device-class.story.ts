import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectMediaQuery: Derived device class',
  subtitle:
    'Because <code>injectMediaQuery</code> returns a plain <code>Signal&lt;boolean&gt;</code>, several queries compose in a single <code>computed()</code> - no host element, no manual sync. The same three lines drop into a store or a route guard unchanged.',
  description:
    'Three injectMediaQuery signals (mobile / tablet / desktop) feed one computed deviceClass. Resize the browser across 640px and 1024px to watch the derived class flip. This is the inject-form strength over the [cngxMediaQuery] directive: the derivation lives in TypeScript, reusable anywhere in the reactive graph, not bound to a template host.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  moduleImports: [
    "import { computed } from '@angular/core';",
    "import { injectMediaQuery } from '@cngx/common/layout';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: ['CngxTag'],
  setup: `protected readonly mobile = injectMediaQuery('(max-width: 639px)');
  protected readonly tablet = injectMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  protected readonly deviceClass = computed(() =>
    this.mobile() ? 'mobile' : this.tablet() ? 'tablet' : 'desktop',
  );`,
  templateChromeBefore: `
  <p style="margin:0 0 0.75rem; color:var(--cngx-text-muted, #71717a)">
    Resize the browser across 640px and 1024px to see the derived class flip.
  </p>`,
  template: `
  <cngx-tag [color]="deviceClass() === 'mobile' ? 'warning' : deviceClass() === 'tablet' ? 'info' : 'success'">
    device: {{ deviceClass() }}
  </cngx-tag>`,
  templateChrome: `
  <div class="status-row" style="margin-top:0.75rem">
    <span class="status-badge" [class.active]="mobile()">mobile: {{ mobile() }}</span>
    <span class="status-badge" [class.active]="tablet()">tablet: {{ tablet() }}</span>
  </div>`,
};
