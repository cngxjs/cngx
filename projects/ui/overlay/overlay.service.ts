import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  Injector,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Type,
} from '@angular/core';
import { Overlay, OverlayConfig, type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CngxOverlayRef } from './overlay-ref';

/**
 * Config accepted by {@link CngxOverlay.open}. A partial of CDK's
 * {@link OverlayConfig} - every field is optional and falls back to the CDK
 * overlay default - plus `disableClose`, a cngx addition that turns off the
 * Escape / backdrop dismiss affordances.
 *
 * @category ui/overlay
 */
export type CngxOverlayConfig = Partial<OverlayConfig> & {
  /**
   * When `true`, Escape and backdrop clicks do not close the overlay; only a
   * programmatic `close()` does. Default `false`.
   */
  readonly disableClose?: boolean;
};

/**
 * Thin service over CDK Overlay that returns a typed CngxOverlayRef.
 *
 * Must be provided via `provideOverlay()` in application or component providers.
 * ```ts
 * // app.config.ts
 * provideOverlay()

 * // usage
 * const ref = overlayService.open(MyComponent, { hasBackdrop: true });
 * ref.afterClosed$.subscribe(result => console.log(result));
* ```
 *
 * @category ui/overlay
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/overlay/overlay.service.ts
 * @since 0.1.0
 * @relatedTo CngxOverlayRef, provideOverlay
 */
@Injectable()
export class CngxOverlay {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  // Held by the only capability the registry needs; the generic CngxOverlayRef
  // is invariant in R (its Subject leaks into the type), so a structural close
  // handle sidesteps that without an unknown-cast.
  private readonly openRefs = new Set<{ close(): void }>();

  constructor() {
    // The service is destroyed with its providing scope (component or
    // environment injector). Anything still open would otherwise leak a
    // detached overlay panel and its subscriptions - close them.
    inject(DestroyRef).onDestroy(() => {
      for (const ref of [...this.openRefs]) {
        ref.close();
      }
    });
  }

  /**
   * Opens `component` in a CDK overlay panel and returns a typed ref.
   *
   * Defaults to a centered, backdropped panel that closes on Escape or a
   * backdrop click; pass `disableClose` to opt out. Focus returns to the
   * element that was focused at open time. Merge `config` to override position
   * strategy, scroll strategy, or any other CDK `OverlayConfig` option.
   *
   * @param component Component class to attach as a portal.
   * @param config Overlay configuration overrides (CDK options + `disableClose`).
   */
  open<C, R = unknown>(component: Type<C>, config: CngxOverlayConfig = {}): CngxOverlayRef<R> {
    const { disableClose, ...cdkConfig } = config;
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      ...cdkConfig,
    });

    const cdkRef: CdkOverlayRef = this.overlay.create(overlayConfig);
    // Capture the opener BEFORE attaching, so focus can return to it on close.
    const restoreFocusTo = this.document.activeElement as HTMLElement | null;
    const ngxRef = new CngxOverlayRef<R>(cdkRef, { disableClose, restoreFocusTo });

    this.openRefs.add(ngxRef);
    ngxRef.afterClosed$.subscribe({ complete: () => this.openRefs.delete(ngxRef) });

    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: CngxOverlayRef, useValue: ngxRef }],
    });

    const portal = new ComponentPortal(component, null, injector);
    cdkRef.attach(portal);
    return ngxRef;
  }
}

/**
 * Provides `CngxOverlay` as an environment-scoped service.
 *
 * @category ui/overlay
 */
export function provideOverlay(): EnvironmentProviders {
  return makeEnvironmentProviders([CngxOverlay]);
}
