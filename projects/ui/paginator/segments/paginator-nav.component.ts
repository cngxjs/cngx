import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxIcon } from '@cngx/common/display';
import { CngxRipple } from '@cngx/common/interactive';

import { injectPaginatorConfig, type CngxPaginatorAriaLabels } from '../paginator-config';
import { CNGX_PAGINATOR_GLYPHS } from '../paginator-glyphs';
import { CNGX_PAGINATOR_HOST, type CngxPaginatorHost } from '../paginator-host.token';

/** Config keys the four nav segments label their button with. */
type NavAriaKey = keyof Pick<CngxPaginatorAriaLabels, 'first' | 'previous' | 'next' | 'last'>;

interface NavCoreOptions {
  /** `true` when the page is at the bound this segment navigates toward. */
  readonly atBound: (host: CngxPaginatorHost) => boolean;
  /** The single host method this segment owns. */
  readonly action: (host: CngxPaginatorHost) => void;
  /** Config key for the button's accessible label. */
  readonly ariaKey: NavAriaKey;
}

interface NavCore {
  readonly disabled: Signal<boolean>;
  readonly ariaLabel: Signal<string>;
  activate(): void;
}

/**
 * Shared nav-button glue. Composition, not an abstract base class: each of the
 * four segments calls this factory as a field initialiser and binds the same
 * template, differing only in selector, glyph, and the three options here.
 */
function createPaginatorNavCore(options: NavCoreOptions): NavCore {
  const host = inject(CNGX_PAGINATOR_HOST);
  const config = injectPaginatorConfig();
  const disabled = computed(() => host.isBusy() || options.atBound(host));
  const ariaLabel = computed(() => config.ariaLabels[options.ariaKey]);
  return {
    disabled,
    ariaLabel,
    activate: () => {
      if (disabled()) {
        return;
      }
      options.action(host);
    },
  };
}

// Shared template - identical across the four segments; only the glyph differs.
// `aria-disabled` (not native `disabled`) keeps the button focusable so AT users
// hear the bound state; `activate()` guards the click.
const NAV_TEMPLATE = `
  <button
    type="button"
    class="cngx-paginator__button cngx-paginator__nav"
    cngxRipple
    [attr.aria-disabled]="core.disabled()"
    (click)="core.activate()"
  >
    <cngx-icon aria-hidden="true">{{ glyph }}</cngx-icon>
    <span class="cngx-paginator__nav-label">{{ core.ariaLabel() }}</span>
  </button>
`;

// Angular's compiler needs literal decorator metadata per component (no
// spreads), so the shared parts are duplicated inline; the behavioural glue
// stays factored in createPaginatorNavCore and the markup in NAV_TEMPLATE.

/** First-page segment. Disabled on the first page; calls `host.first()`.
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/first/chevron</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
*/
@Component({
  selector: 'cngx-pgn-first',
  exportAs: 'cngxPgnFirst',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxIcon, CngxRipple],
  template: NAV_TEMPLATE,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorFirst {
  protected readonly glyph = CNGX_PAGINATOR_GLYPHS.first;
  protected readonly core = createPaginatorNavCore({
    atBound: (host) => host.isFirst(),
    action: (host) => host.first(),
    ariaKey: 'first',
  });
}

/** Previous-page segment. Disabled on the first page; calls `host.previous()`.
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/prev/chevron</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/reset-on-filter</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/url-synced-paging</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/card-grid</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/paginated-list</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/select-panel-footer</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/minimal</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/segmented</example-url>
*/
@Component({
  selector: 'cngx-pgn-prev',
  exportAs: 'cngxPgnPrev',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxIcon, CngxRipple],
  template: NAV_TEMPLATE,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorPrev {
  protected readonly glyph = CNGX_PAGINATOR_GLYPHS.previous;
  protected readonly core = createPaginatorNavCore({
    atBound: (host) => host.isFirst(),
    action: (host) => host.previous(),
    ariaKey: 'previous',
  });
}

/** Next-page segment. Disabled on the last page; calls `host.next()`.
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/next/chevron</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/reset-on-filter</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/url-synced-paging</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/card-grid</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/paginated-list</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/select-panel-footer</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/minimal</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/segmented</example-url>
*/
@Component({
  selector: 'cngx-pgn-next',
  exportAs: 'cngxPgnNext',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxIcon, CngxRipple],
  template: NAV_TEMPLATE,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorNext {
  protected readonly glyph = CNGX_PAGINATOR_GLYPHS.next;
  protected readonly core = createPaginatorNavCore({
    atBound: (host) => host.isLast(),
    action: (host) => host.next(),
    ariaKey: 'next',
  });
}

/** Last-page segment. Disabled on the last page; calls `host.last()`.
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/last/chevron</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
*/
@Component({
  selector: 'cngx-pgn-last',
  exportAs: 'cngxPgnLast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxIcon, CngxRipple],
  template: NAV_TEMPLATE,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorLast {
  protected readonly glyph = CNGX_PAGINATOR_GLYPHS.last;
  protected readonly core = createPaginatorNavCore({
    atBound: (host) => host.isLast(),
    action: (host) => host.last(),
    ariaKey: 'last',
  });
}
