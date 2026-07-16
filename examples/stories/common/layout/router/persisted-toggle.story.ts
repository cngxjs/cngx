import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectQueryParamSync: Persisted toggle',
  subtitle:
    '<code>injectQueryParamSync(state, { param })</code> keeps a <code>WritableSignal</code> in sync with a named query param. The URL wins on load (deep-link intent); after that the signal is the source and reflects outward. Reflect writes happen in <code>untracked()</code> and skip when the value is unchanged, so there is no signal&#8596;URL loop.',
  description:
    'Toggle the panel and watch the address bar gain "?panel=open". Reload the page: the panel restores from the URL. Browser back/forward re-hydrates the signal. When @angular/router is absent the helper dev-warns once and no-ops.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { injectQueryParamSync } from '@cngx/common/layout';",
    "import { CngxTag } from '@cngx/common/display';",
  ],
  imports: ['CngxTag'],
  setup: `protected readonly panelOpen = signal(false);

  constructor() {
    injectQueryParamSync(this.panelOpen, { param: 'panel' });
  }`,
  templateChromeBefore: `
  <p style="margin:0 0 0.75rem; color:var(--cngx-text-muted, #71717a)">
    Toggle the panel, then check the URL for <code>?panel=open</code>. Reload to restore it.
  </p>`,
  template: `
  <button type="button"
          class="chip"
          [attr.aria-expanded]="panelOpen()"
          aria-controls="cngx-qps-panel"
          (click)="panelOpen.set(!panelOpen())">
    {{ panelOpen() ? 'Close panel' : 'Open panel' }}
  </button>
  <cngx-tag [color]="panelOpen() ? 'success' : 'neutral'">
    panel: {{ panelOpen() ? 'open' : 'closed' }}
  </cngx-tag>
  <div id="cngx-qps-panel"
       role="region"
       aria-label="Persisted panel"
       [hidden]="!panelOpen()"
       style="margin-top:0.75rem; padding:0.75rem; border:1px solid var(--cngx-border, #e4e4e7); border-radius:var(--cngx-radius, 0.5rem)">
    This panel's open state lives in <code>?panel=open</code>. Reload or share the URL to restore it.
  </div>`,
};
