import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'provideCngxI18n: app-wide German pack',
  subtitle:
    '<code>provideCngxI18n(withPack(CNGX_LANGUAGE_DE))</code> in the app config replaces every per-token <code>provide*I18n</code> call: each component reads its copy, the locale and the direction from the one German language file.',
  description:
    "The pack is app-wide: every component reads its copy through root-shared tokens, so the call belongs in <code>bootstrapApplication</code> providers. A <code>provideCngxI18n</code> in a child injector, such as route providers, only moves <code>CNGX_LOCALE</code>, <code>CNGX_DIRECTION</code> and <code>&lt;html lang&gt;</code>; the copy stays with the root pack. This examples app installs the pack at its root only when the page is opened with <code>?pack=de</code>, with <code>withDocumentLanguage('off')</code> so the live page keeps its own <code>&lt;html lang&gt;</code>. Without the parameter the paginator below reads English; reload with the link to see it in German. <code>withDocumentLanguage('on')</code> is the default and writes <code>&lt;html lang&gt;</code> and <code>&lt;html dir&gt;</code> from the pack; the demo shows it on a detached document built by <code>createIsolatedRoot()</code>, a demo fixture, so it never stamps this page.",
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  apiComponents: [
    'provideCngxI18n',
    'withPack',
    'withDocumentLanguage',
    'CNGX_LANGUAGE_DE',
    'CNGX_LANGUAGE_PACK',
  ],
  moduleImports: [
    "import { DOCUMENT } from '@angular/common';",
    "import { CNGX_LANGUAGE_PACK, provideCngxI18n, withDocumentLanguage, withPack } from '@cngx/core/i18n';",
    "import { CNGX_LANGUAGE_DE } from '@cngx/core/i18n/de';",
    "import { CngxPaginator, CngxPaginatorLoadMore, CngxPaginatorRange, CngxPaginatorStatus } from '@cngx/ui/paginator';",
    "import { createIsolatedRoot, demoPackParam } from '../../../../fixtures';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorRange', 'CngxPaginatorStatus', 'CngxPaginatorLoadMore'],
  setup: `
  // App config (here installed for ?pack=de, with withDocumentLanguage('off')):
  // bootstrapApplication(App, { providers: [provideCngxI18n(withPack(CNGX_LANGUAGE_DE))] });
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  // The default withDocumentLanguage('on') on a detached document.
  private readonly isolated = createIsolatedRoot([
    provideCngxI18n(withPack(CNGX_LANGUAGE_DE), withDocumentLanguage('on')),
  ]);`,
  template: `
  <cngx-paginator
    aria-label="Orders"
    [total]="1200"
    [pageIndex]="pageIndex()"
    (pageIndexChange)="pageIndex.set($event)"
    [pageSize]="pageSize()"
    (pageSizeChange)="pageSize.set($event)"
  >
    <cngx-pgn-range />
    <cngx-pgn-status />
    <cngx-pgn-load-more />
  </cngx-paginator>`,
  setupChrome: `
  protected readonly packParam = demoPackParam();
  protected readonly activePack = inject(CNGX_LANGUAGE_PACK);
  private readonly liveRoot = inject(DOCUMENT).documentElement;
  protected readonly liveLang = signal('-');
  protected readonly isolatedAttributes = signal('-');

  constructor() {
    afterNextRender(() => {
      this.liveLang.set(this.liveRoot.lang || '(absent)');
      const html = this.isolated.document.documentElement;
      this.isolatedAttributes.set('lang=' + (html.lang || '(absent)') + ', dir=' + (html.dir || '(absent)'));
    });
  }`,
  templateChrome: `
  <div class="button-row">
    <a href="?pack=de#/core/i18n/pack-providers/app-wide-german-pack">Reload with ?pack=de</a>
    <a href="./#/core/i18n/pack-providers/app-wide-german-pack">Reload without a pack</a>
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">?pack parameter</span>
      <span class="event-value">{{ packParam ?? '(none, English defaults)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Root CNGX_LANGUAGE_PACK locale</span>
      <span class="event-value">{{ activePack().locale }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Live page &lt;html lang&gt; (withDocumentLanguage('off'))</span>
      <span class="event-value">{{ liveLang() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Detached &lt;html&gt; (withDocumentLanguage('on'))</span>
      <span class="event-value">{{ isolatedAttributes() }}</span>
    </div>
  </div>`,
};
