import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { CngxContainer } from '@cngx/common/layout';
import { CngxSidenav } from './sidenav';

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
 * @since 0.1.0
 * @relatedTo CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter
 */
@Component({
  selector: 'cngx-sidenav-layout',
  exportAs: 'cngxSidenavLayout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./sidenav-layout.css'],
  hostDirectives: [CngxContainer],
  host: {
    '[class.cngx-sidenav-layout]': 'true',
    '[class.cngx-sidenav-layout--ready]': 'ready()',
    '[class.cngx-sidenav-layout--has-overlay]': 'hasModalOverlay()',
  },
  template: `
    <ng-content select="cngx-sidenav[position=start], cngx-sidenav:not([position])" />
    <ng-content select="cngx-sidenav-content" />
    <ng-content select="cngx-sidenav[position=end]" />
    <!-- Visual only: the open rail's surface makes it inert and dismisses on
         a press outside the rail, so the backdrop needs no handler. -->
    @if (hasModalOverlay()) {
      <div class="cngx-sidenav-backdrop" aria-hidden="true"></div>
    }
  `,
})
export class CngxSidenavLayout {
  private readonly readyState = signal(false);
  /** @internal First render done - gates transitions against an open-on-load flash. */
  protected readonly ready = this.readyState.asReadonly();

  private readonly sidenavs = contentChildren(CngxSidenav);

  /** The start-positioned sidenav, if any. */
  readonly startSidenav = computed(
    () => this.sidenavs().find((s) => s.position() === 'start') ?? null,
  );

  /** The end-positioned sidenav, if any. */
  readonly endSidenav = computed(() => this.sidenavs().find((s) => s.position() === 'end') ?? null);

  /** Whether any sidenav is open in overlay mode. */
  readonly hasOverlay = computed(() => this.sidenavs().some((s) => s.overlayActive()));

  /** Whether an open overlay takes over the page or the layout (backdrop shown). */
  readonly hasModalOverlay = computed(() =>
    this.sidenavs().some((s) => s.overlayActive() && s.modality() !== 'none'),
  );

  constructor() {
    // Gate transitions until after first render - prevents open-on-load flash.
    afterNextRender(() => this.readyState.set(true));
  }

  /** Closes all sidenavs that are currently in overlay mode. */
  closeAllOverlays(): void {
    for (const nav of this.sidenavs()) {
      if (nav.isOverlay() && nav.opened()) {
        nav.close();
      }
    }
  }
}
