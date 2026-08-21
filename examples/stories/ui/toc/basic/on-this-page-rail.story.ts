import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToc: on this page rail',
  subtitle:
    'A <code>&lt;cngx-toc&gt;</code> renders a labeled <code>nav</code> of anchor links from a tree of items. Scroll the article and the active link tracks the most visible section through an internal <code>CngxScrollSpy</code>, reflected on <code>aria-current</code>. Nested items render as an indented sub-list; native link semantics and tab order stay intact.',
  description:
    'The rail is pure composition over the scroll-spy atom - zero IntersectionObserver code in the organism. Bind [items] to the outline and contentRoot to the scroll container selector; everything else is derived.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'WAI-ARIA aria-current',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
    {
      label: 'ARIA navigation landmark',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
    },
  ],
  apiComponents: ['CngxToc'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxToc, type CngxTocItem } from '@cngx/ui/toc';",
  ],
  imports: ['CngxToc'],
  setup: `protected readonly toc: CngxTocItem[] = [
    { id: 'sec-intro', label: 'Introduction' },
    {
      id: 'sec-install',
      label: 'Installation',
      children: [
        { id: 'sec-install-npm', label: 'Using npm' },
        { id: 'sec-install-yarn', label: 'Using yarn' },
      ],
    },
    { id: 'sec-usage', label: 'Usage' },
    { id: 'sec-api', label: 'API reference' },
  ];
  protected readonly sections = [
    { id: 'sec-intro', label: 'Introduction' },
    { id: 'sec-install', label: 'Installation' },
    { id: 'sec-install-npm', label: 'Using npm' },
    { id: 'sec-install-yarn', label: 'Using yarn' },
    { id: 'sec-usage', label: 'Usage' },
    { id: 'sec-api', label: 'API reference' },
  ];
  protected readonly lastActivated = signal<string>('none');`,
  template: `  <div style="display:flex; gap:24px; max-width:680px">
    <cngx-toc [items]="toc"
              contentRoot=".toc-article"
              (activated)="lastActivated.set($event.label)"
              style="position:sticky; top:0; align-self:flex-start; min-width:160px"></cngx-toc>
    <div class="toc-article" style="height:320px; overflow-y:auto; flex:1; padding-inline-end:8px">
      @for (s of sections; track s.id) {
        <section [id]="s.id" style="min-height:220px">
          <h3 style="margin-top:0">{{ s.label }}</h3>
          <p>Scroll the article. The rail's active link tracks the most visible
             section and reflects it on aria-current.</p>
        </section>
      }
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last activated</span>
      <span class="event-value">{{ lastActivated() }}</span>
    </div>
  </div>`,
};
