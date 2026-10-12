import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToc: App-wide defaults',
  subtitle:
    'One <code>provideTocConfigAt(...)</code> moves every toc default at once: <code>withTocSpy</code> retunes the scroll spy, <code>withTocScrollBehavior</code> picks the jump, <code>withTocAriaLabels</code> renames the <code>nav</code> landmark and <code>withTocTemplates</code> registers the item template. The left rail reads the library defaults, the right rail reads the scoped config, both over the same article.',
  description:
    "A <code>TemplateRef</code> exists only once a view is rendered, so the item template cannot be handed to a provider in <code>viewProviders</code>. The demo builds the scope with <code>Injector.create</code> from the rendered template and passes it to <code>ngTemplateOutlet</code>; a toc inside the outlet resolves <code>CNGX_TOC_CONFIG</code> from that injector, the plain toc next to it does not. With <code>rootMargin: '0px 0px -60% 0px'</code> and <code>threshold: 0</code>, a section counts as active as soon as it enters the top 40% of the article, so the right rail switches earlier while you scroll. Clicking a right-rail link jumps instantly (<code>'auto'</code>); the left rail scrolls smoothly. Reduced motion forces the instant jump on both. The landmark names are not visible, so the readout mirrors each <code>nav</code> <code>aria-label</code> from the DOM.",
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  references: [
    {
      label: 'ARIA navigation landmark',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/navigation.html',
    },
  ],
  apiComponents: ['CngxToc'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { ElementRef } from '@angular/core';",
    "import { CngxToc, provideTocConfigAt, withTocAriaLabels, withTocScrollBehavior, withTocSpy, withTocTemplates, type CngxTocItem, type CngxTocItemContext } from '@cngx/ui/toc';",
  ],
  imports: ['CngxToc', 'NgTemplateOutlet'],
  setup: `private readonly injector = inject(Injector);
  private readonly itemTpl = viewChild.required<TemplateRef<CngxTocItemContext>>('tocItem');

  protected readonly tocScope = computed(() =>
    Injector.create({
      parent: this.injector,
      providers: [
        provideTocConfigAt(
          withTocSpy({ rootMargin: '0px 0px -60% 0px', threshold: 0 }),
          withTocScrollBehavior('auto'),
          withTocAriaLabels({ nav: 'Guide sections' }),
          withTocTemplates({ item: this.itemTpl() }),
        ),
      ],
    }),
  );

  protected readonly toc: CngxTocItem[] = [
    { id: 'cfg-intro', label: 'Introduction' },
    {
      id: 'cfg-setup',
      label: 'Setup',
      children: [
        { id: 'cfg-setup-install', label: 'Install' },
        { id: 'cfg-setup-providers', label: 'Providers' },
      ],
    },
    { id: 'cfg-usage', label: 'Usage' },
    { id: 'cfg-faq', label: 'FAQ' },
  ];
  protected readonly sections = [
    { id: 'cfg-intro', label: 'Introduction' },
    { id: 'cfg-setup', label: 'Setup' },
    { id: 'cfg-setup-install', label: 'Install' },
    { id: 'cfg-setup-providers', label: 'Providers' },
    { id: 'cfg-usage', label: 'Usage' },
    { id: 'cfg-faq', label: 'FAQ' },
  ];`,
  template: `  <ng-template #tocItem let-item let-active="active" let-depth="depth">
    <span class="demo-toc-config-item" [class.demo-toc-config-item--active]="active">
      <span class="demo-toc-config-marker" aria-hidden="true"></span>{{ item.label }}
    </span>
  </ng-template>

  <ng-template #configuredToc>
    <cngx-toc #scopedToc [items]="toc" contentRoot=".demo-toc-config-article" />
  </ng-template>

  <div class="demo-toc-config-layout">
    <div class="demo-toc-config-rail">
      <h3 class="demo-toc-config-heading">Library defaults</h3>
      <cngx-toc #plainToc [items]="toc" contentRoot=".demo-toc-config-article" />
    </div>
    <div class="demo-toc-config-article demo-toc-scroll" role="region" tabindex="0" aria-label="Guide article">
      @for (s of sections; track s.id) {
        <section [id]="s.id" class="demo-toc-config-section">
          <h3>{{ s.label }}</h3>
          <p>Scroll the article and compare which link each rail marks as current.</p>
        </section>
      }
    </div>
    <div class="demo-toc-config-rail">
      <h3 class="demo-toc-config-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="configuredToc; injector: tocScope()" />
    </div>
  </div>`,
  setupChrome: `private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly plain = viewChild.required<CngxToc>('plainToc');
  private readonly scoped = viewChild<CngxToc>('scopedToc');
  protected readonly navNames = signal<readonly string[]>(['-', '-']);

  protected readonly plainActive = computed(() => this.plain().activeId() ?? '-');
  protected readonly scopedActive = computed(() => this.scoped()?.activeId() ?? '-');
  protected readonly plainSpy = computed(() => this.plain().rootMargin() + ', threshold ' + this.plain().threshold());
  protected readonly scopedSpy = computed(() => {
    const toc = this.scoped();
    return toc ? toc.rootMargin() + ', threshold ' + toc.threshold() : '-';
  });

  private readonly readNames = afterNextRender(() => {
    const navs = Array.from(this.hostEl.nativeElement.querySelectorAll('cngx-toc nav'));
    this.navNames.set(navs.map((nav) => nav.getAttribute('aria-label') ?? '-'));
  });`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Left nav name</span><span class="event-value">{{ navNames()[0] }}</span></div>
    <div class="event-row"><span class="event-label">Right nav name</span><span class="event-value">{{ navNames()[1] }}</span></div>
    <div class="event-row"><span class="event-label">Left spy</span><span class="event-value">{{ plainSpy() }}</span></div>
    <div class="event-row"><span class="event-label">Right spy</span><span class="event-value">{{ scopedSpy() }}</span></div>
    <div class="event-row"><span class="event-label">Left active</span><span class="event-value">{{ plainActive() }}</span></div>
    <div class="event-row"><span class="event-label">Right active</span><span class="event-value">{{ scopedActive() }}</span></div>
  </div>`,
};
