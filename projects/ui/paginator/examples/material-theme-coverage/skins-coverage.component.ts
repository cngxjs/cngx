import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorDots,
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRail,
  CngxPaginatorRange,
  CngxPaginatorStatus,
} from '@cngx/ui/paginator';

/**
 * Every `CngxPaginator` skin rendered against a Material 3 palette, all seven
 * driven by one shared page state.
 *
 * `skin` is paint-only: the seven paginators differ by a single `[data-skin]`
 * attribute, yet they share the SAME `pageIndex` / `pageSize` signals - so
 * paging any one row (clicking a page number, the dots, prev / next, or the
 * bar's items-per-page) moves every other row in lockstep. The two halves are
 * wired explicitly (`[pageIndex]` + `(pageIndexChange)`) rather than via the
 * `[(pageIndex)]` sugar: the input is aliased onto the `CngxPaginate` host
 * directive while the matching output lives on the `CngxPaginator` shell, and
 * `strictTemplates` rejects a two-way box whose halves resolve to different
 * targets (NG8007). The colour comes
 * entirely from the published bridge: the example's stylesheet builds a real M3
 * theme with `mat.theme` (which emits the `--mat-sys-*` system tokens), then
 * `@cngx/themes/material/paginator-theme` maps every `--cngx-*` paginator knob
 * onto its Material counterpart:
 *
 * ```scss
 * @use '@angular/material' as mat;
 * @use '@cngx/themes/material/paginator-theme.scss' as paginator;
 *
 * $theme: mat.define-theme((color: (theme-type: light, primary: mat.$azure-palette)));
 * html {
 *   @include mat.theme($theme);
 *   @include paginator.theme($theme);
 * }
 * ```
 *
 * No per-skin colour overrides and no hand-copied tokens - each skin inherits
 * primary / surface / outline from the palette. `ViewEncapsulation.None` lets
 * the global `html` theme and the `:where(cngx-paginator)` bridge rules reach
 * every paginator (including the items-per-page / ellipsis-overflow popovers,
 * which the bridge paints as a mat-menu surface).
 *
 * Roboto is loaded at runtime: `mat.theme((typography: Roboto))` only NAMES the
 * family on `--mat-sys-*-font`, it never ships the webfont, and the playground
 * scaffold's `index.html` has no seam to add a `<link>` (Material auto-detect
 * only fires for `<mat-*>` templates, and this one is cngx-only). So the
 * constructor appends the Google Fonts `<link>` to `<head>` and tags `<body>`
 * with the `mat-typography` / `mat-app-background` classes - without the font
 * load every numeral falls back to the system sans and nothing reads as Material.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
    CngxPaginatorRange,
    CngxPaginatorStatus,
    CngxPaginatorRail,
    CngxPaginatorDots,
    CngxPaginatorPageSize,
  ],
  styleUrl: './skins-coverage.component.scss',
  template: `
    <div class="coverage">
      <section>
        <h3>numbered</h3>
        <cngx-paginator
          skin="numbered"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-first />
          <cngx-pgn-prev />
          <cngx-pgn-pages />
          <cngx-pgn-next />
          <cngx-pgn-last />
          <cngx-pgn-range />
        </cngx-paginator>
      </section>

      <section>
        <h3>minimal</h3>
        <cngx-paginator
          skin="minimal"
          data-nav-labels
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-prev />
          <cngx-pgn-status />
          <cngx-pgn-next />
        </cngx-paginator>
      </section>

      <section>
        <h3>pill</h3>
        <cngx-paginator
          skin="pill"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-first />
          <cngx-pgn-prev />
          <cngx-pgn-pages />
          <cngx-pgn-next />
          <cngx-pgn-last />
        </cngx-paginator>
      </section>

      <section>
        <h3>segmented</h3>
        <cngx-paginator
          skin="segmented"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-prev />
          <cngx-pgn-pages />
          <cngx-pgn-next />
        </cngx-paginator>
      </section>

      <section>
        <h3>rail</h3>
        <cngx-paginator
          skin="rail"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-prev />
          <cngx-pgn-rail />
          <cngx-pgn-status />
          <cngx-pgn-next />
        </cngx-paginator>
      </section>

      <section>
        <h3>dots</h3>
        <cngx-paginator
          skin="dots"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-prev />
          <cngx-pgn-dots />
          <cngx-pgn-next />
        </cngx-paginator>
      </section>

      <section>
        <h3>bar</h3>
        <cngx-paginator
          skin="bar"
          [total]="total"
          [pageIndex]="pageIndex()"
          (pageIndexChange)="pageIndex.set($event)"
          [pageSize]="pageSize()"
          (pageSizeChange)="pageSize.set($event)"
        >
          <cngx-pgn-page-size [options]="sizes" />
          <cngx-pgn-range />
          <cngx-pgn-first />
          <cngx-pgn-prev />
          <cngx-pgn-pages />
          <cngx-pgn-next />
          <cngx-pgn-last />
        </cngx-paginator>
      </section>

      <div class="coverage__toolbar">
        <span>Shared page: {{ pageIndex() + 1 }} of {{ pageCount() }}</span>
        <span>Page size: {{ pageSize() }}</span>
      </div>
    </div>
  `,
})
export class SkinsCoverageExample {
  protected readonly total = 240;
  protected readonly sizes = [10, 25, 50] as const;

  protected readonly pageIndex = signal(2);
  protected readonly pageSize = signal(10);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total / this.pageSize())));

  private readonly document = inject(DOCUMENT);

  constructor() {
    const head = this.document.head;

    const preconnect = this.document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.gstatic.com';
    preconnect.crossOrigin = '';
    head.appendChild(preconnect);

    const roboto = this.document.createElement('link');
    roboto.rel = 'stylesheet';
    roboto.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
    head.appendChild(roboto);

    this.document.body.classList.add('mat-typography', 'mat-app-background');
  }
}
