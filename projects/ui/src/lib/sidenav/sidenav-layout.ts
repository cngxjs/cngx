import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { CngxSidenav } from './sidenav';

/**
 * Container for one or two `CngxSidenav` panels and a `CngxSidenavContent`.
 *
 * Manages shared backdrop, scroll lock, and click-outside coordination.
 * Supports up to two sidenavs: one `position="start"` and one `position="end"`.
 *
 * @usageNotes
 *
 * ### Dual sidebar
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start" [(opened)]="navOpen"
 *                 [responsive]="'(min-width: 1024px)'">
 *     Left nav
 *   </cngx-sidenav>
 *   <cngx-sidenav-content>
 *     Main content
 *   </cngx-sidenav-content>
 *   <cngx-sidenav position="end" [(opened)]="detailOpen">
 *     Right detail panel
 *   </cngx-sidenav>
 * </cngx-sidenav-layout>
 * ```
 */
@Component({
  selector: 'cngx-sidenav-layout',
  exportAs: 'cngxSidenavLayout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-sidenav-layout]': 'true',
    '[class.cngx-sidenav-layout--has-overlay]': 'hasOverlay()',
  },
  template: `
    <ng-content select="cngx-sidenav[position=start], cngx-sidenav:not([position])" />
    <ng-content select="cngx-sidenav-content" />
    <ng-content select="cngx-sidenav[position=end]" />
    @if (hasOverlay()) {
      <div class="cngx-sidenav-backdrop"
           (click)="closeAllOverlays()"></div>
    }
  `,
})
export class CngxSidenavLayout {
  private readonly _sidenavs = contentChildren(CngxSidenav);

  /** The start-positioned sidenav, if any. */
  readonly startSidenav = computed(() =>
    this._sidenavs().find((s) => s.position() === 'start') ?? null,
  );

  /** The end-positioned sidenav, if any. */
  readonly endSidenav = computed(() =>
    this._sidenavs().find((s) => s.position() === 'end') ?? null,
  );

  /** Whether any sidenav is open in overlay mode. */
  readonly hasOverlay = computed(() =>
    this._sidenavs().some((s) => s.isOverlay() && s.opened()),
  );

  constructor() {
    const doc = inject(DOCUMENT);

    // Scroll lock when overlay is active
    effect(() => {
      const html = doc.documentElement;
      if (this.hasOverlay()) {
        html.style.overflow = 'hidden';
        html.style.scrollbarGutter = 'stable';
      } else {
        html.style.overflow = '';
        html.style.scrollbarGutter = '';
      }
    });

    // Click-outside: close overlay sidenavs when clicking outside the layout
    fromEvent<MouseEvent>(doc, 'click')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (!this.hasOverlay()) {
          return;
        }
        for (const nav of this._sidenavs()) {
          if (
            nav.isOverlay() &&
            nav.opened() &&
            !(nav.elementRef.nativeElement as HTMLElement).contains(e.target as Node)
          ) {
            nav.close();
          }
        }
      });
  }

  /** Closes all sidenavs that are currently in overlay mode. */
  closeAllOverlays(): void {
    for (const nav of this._sidenavs()) {
      if (nav.isOverlay() && nav.opened()) {
        nav.close();
      }
    }
  }
}
