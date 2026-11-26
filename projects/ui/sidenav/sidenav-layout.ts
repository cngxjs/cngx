import { DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_CONTAINER_SIZE, CngxContainer } from '@cngx/common/layout';

import {
  CNGX_SIDENAV,
  CNGX_SIDENAV_LAYOUT,
  type CngxSidenavContract,
  type CngxSidenavLayoutCoordinator,
} from './sidenav-token';

/**
 * Container for one or two `CngxSidenav` panels and a `CngxSidenavContent`.
 *
 * Renders the shared backdrop behind a modal overlay. Focus trap, scroll lock,
 * `inert` and dismissal on Escape or an outside press belong to each rail's
 * composed `CngxDrawerSurface`. Supports up to two sidenavs: one
 * `position="start"` and one `position="end"`.
 *
 * It is also the query container the rails resolve their `'auto'` mode
 * against: the stylesheet declares and names the container
 * (`cngx-sidenav-layout`) and carries the single docking threshold, the
 * composed `CngxContainer` observes it and publishes the resolved value. A
 * rail mounted without this layout has no container and falls back to
 * `over`.
 *
 * ### Dual sidebar
 * ```html
 * <cngx-sidenav-layout>
 *   <cngx-sidenav position="start" [(opened)]="navOpen">
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
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/sidenav-layout.ts
 * @since 0.3.0
 * @relatedTo CngxSidenav, CngxSidenavContent, CngxNavHeader, CngxNavFooter
 */
@Component({
  selector: 'cngx-sidenav-layout',
  exportAs: 'cngxSidenavLayout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./sidenav-layout.css'],
  hostDirectives: [CngxContainer],
  providers: [{ provide: CNGX_SIDENAV_LAYOUT, useExisting: CngxSidenavLayout }],
  host: {
    '[class.cngx-sidenav-layout]': 'true',
    '[class.cngx-sidenav-layout--ready]': 'ready()',
    '[class.cngx-sidenav-layout--has-overlay]': 'hasModalOverlay()',
  },
  template: `
    <ng-content select="cngx-sidenav[position=start], cngx-sidenav:not([position])" />
    <ng-content select="cngx-sidenav-content" />
    <ng-content select="cngx-sidenav[position=end]" />
    <!-- Visual only, always rendered so it fades with the panel: the open
         rail's surface makes it inert and dismisses on a press outside the
         rail, so it needs no handler. --has-overlay shows it. -->
    <div class="cngx-sidenav-backdrop" aria-hidden="true"></div>
  `,
})
export class CngxSidenavLayout implements CngxSidenavLayoutCoordinator {
  private readonly container = inject(CNGX_CONTAINER_SIZE, { self: true });
  // No ResizeObserver (SSR, jsdom): no observation ever arrives, so the layout
  // starts ready instead of staying hidden.
  private readonly readyState = signal(!this.container.observes);
  /**
   * @internal The settled layout has been painted once - gates transitions and
   * the reveal.
   */
  protected readonly ready = this.readyState.asReadonly();

  private readonly sidenavs = contentChildren(CNGX_SIDENAV);

  /** @internal The start-positioned sidenav, if any. */
  readonly startSidenav = computed(
    () => this.sidenavs().find((s) => s.position() === 'start') ?? null,
  );

  /** @internal The end-positioned sidenav, if any. */
  readonly endSidenav = computed(() => this.sidenavs().find((s) => s.position() === 'end') ?? null);

  /** @internal Whether any sidenav is open in overlay mode. */
  readonly hasOverlay = computed(() => this.sidenavs().some((s) => s.overlayActive()));

  /** Whether an open overlay takes over the page or the layout (backdrop shown). */
  readonly hasModalOverlay = computed(() =>
    this.sidenavs().some((s) => s.overlayActive() && s.modality() !== 'none'),
  );

  constructor() {
    if (!this.container.observes) {
      return;
    }
    // The rails resolve their width class from the container's observed size;
    // a hidden layout reports 0 and still reads as compact. Once sized, the
    // settled state must be painted once, hidden, before --ready reveals the
    // layout and turns transitions on: in the same frame the reveal would show
    // the move, and in the same style pass the transitions would animate it.
    // Two frames, because the first callback may still run before that paint.
    const win = inject(DOCUMENT).defaultView;
    const gate = afterRenderEffect({
      read: (onCleanup) => {
        if (!win || this.container.inlineSize() === 0) {
          return;
        }
        let id = win.requestAnimationFrame(() => {
          id = win.requestAnimationFrame(() => {
            this.readyState.set(true);
            gate.destroy();
          });
        });
        onCleanup(() => win.cancelAnimationFrame(id));
      },
    });
  }

  /** @internal Closes all sidenavs that are currently in overlay mode. */
  closeAllOverlays(): void {
    for (const nav of this.sidenavs()) {
      if (nav.overlayActive()) {
        nav.close();
      }
    }
  }

  /** @internal Whether `rail` is one of this layout's direct rails. */
  owns(rail: CngxSidenavContract): boolean {
    return this.sidenavs().includes(rail);
  }

  /** @internal One open overlay per layout: called from a rail's open path. */
  overlayOpening(rail: CngxSidenavContract): void {
    for (const nav of this.sidenavs()) {
      if (nav !== rail && nav.overlayActive()) {
        nav.close();
      }
    }
  }
}
