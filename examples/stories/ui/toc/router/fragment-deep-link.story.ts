import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTocRouterSync: fragment deep-link',
  subtitle:
    'Add <code>[cngxTocRouterSync]</code> to a <code>&lt;cngx-toc&gt;</code> and activating a link writes the section id to the URL fragment (replacing the history entry, so a scroll-driven rail never floods the back stack). A deep link like <code>#sec-usage</code> scrolls to that section once on load. The directive reaches the rail through the <code>CNGX_TOC</code> contract token, never the concrete class.',
  description:
    'Click a link and watch the URL fragment update; reload or share that URL to jump straight to the section. Without @angular/router the directive dev-warns once and no-ops.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration'],
  apiComponents: ['CngxTocRouterSync', 'CngxToc'],
  moduleImports: [
    "import { inject } from '@angular/core';",
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { ActivatedRoute } from '@angular/router';",
    "import { CngxToc, CngxTocRouterSync, type CngxTocItem } from '@cngx/ui/toc';",
  ],
  imports: ['CngxToc', 'CngxTocRouterSync'],
  setup: `protected readonly toc: CngxTocItem[] = [
    { id: 'sec-intro', label: 'Introduction' },
    { id: 'sec-install', label: 'Installation' },
    { id: 'sec-usage', label: 'Usage' },
    { id: 'sec-api', label: 'API reference' },
  ];
  protected readonly sections = this.toc;`,
  setupChrome: `private readonly route = inject(ActivatedRoute);
  protected readonly fragment = toSignal(this.route.fragment);`,
  templateChromeBefore: `
  <p style="margin:0 0 0.75rem; color:var(--cngx-color-text-muted, #71717a)">
    Click a link, then check the URL fragment. Reload or share it to jump back to the section.
  </p>`,
  template: `  <div style="display:flex; gap:24px; max-width:680px">
    <cngx-toc cngxTocRouterSync
              [items]="toc"
              contentRoot=".toc-article-router"
              style="position:sticky; top:0; align-self:flex-start; min-width:160px"></cngx-toc>
    <div class="toc-article-router" style="height:320px; overflow-y:auto; flex:1; padding-inline-end:8px">
      @for (s of sections; track s.id) {
        <section [id]="s.id" style="min-height:220px">
          <h3 style="margin-top:0">{{ s.label }}</h3>
          <p>Activating this section's link reflects its id into the URL fragment.</p>
        </section>
      }
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">URL fragment</span>
      <span class="event-value">{{ fragment() ?? 'none' }}</span>
    </div>
  </div>`,
};
