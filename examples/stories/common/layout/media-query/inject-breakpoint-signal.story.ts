import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectMediaQuery: Breakpoint signal',
  subtitle:
    '<code>injectMediaQuery(query)</code> is the inject-form of <code>[cngxMediaQuery]</code>: a reactive <code>Signal&lt;boolean&gt;</code> with no host element. Call it in any injection context - a component field, a store, a route guard - where component logic (not just CSS) must react to the viewport.',
  description:
    'The signal is injected in a field initializer, then a computed label drives the readout. Resize the browser across 640px to watch it flip between "compact" and "wide". In SSR the signal stays false and wires no listener, so the same code runs on the server without throwing.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  moduleImports: [
    "import { computed } from '@angular/core';",
    "import { injectMediaQuery } from '@cngx/common/layout';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: ['CngxTag'],
  setup: `protected readonly compact = injectMediaQuery('(max-width: 640px)');
  protected readonly label = computed(() => (this.compact() ? 'compact' : 'wide'));`,
  templateChromeBefore: `
  <p style="margin:0 0 0.75rem; color:var(--cngx-text-muted, #71717a)">
    Resize the browser across 640px to see the signal flip.
  </p>`,
  template: `
  <cngx-tag [color]="compact() ? 'info' : 'neutral'">
    layout: {{ label() }}
  </cngx-tag>`,
};
