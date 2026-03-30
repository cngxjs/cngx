import {
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

export type CngxOverlayConfig = Partial<OverlayConfig>;

/**
 * Thin service over CDK Overlay that returns a typed CngxOverlayRef.
 *
 * Must be provided via `provideOverlay()` in application or component providers.
 *
 * @example
 * // app.config.ts
 * provideOverlay()
 *
 * // usage
 * const ref = overlayService.open(MyComponent, { hasBackdrop: true });
 * ref.afterClosed$.subscribe(result => console.log(result));
 *
 * @category overlay
 */
@Injectable()
export class CngxOverlay {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  /**
   * Opens `component` in a CDK overlay panel and returns a typed ref.
   *
   * Defaults to a centered, backdropped panel. Merge `config` to override
   * position strategy, scroll strategy, or any other CDK `OverlayConfig` option.
   *
   * @param component Component class to attach as a portal.
   * @param config CDK overlay configuration overrides.
   */
  open<C, R = unknown>(component: Type<C>, config: CngxOverlayConfig = {}): CngxOverlayRef<R> {
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      ...config,
    });

    const cdkRef: CdkOverlayRef = this.overlay.create(overlayConfig);
    const ngxRef = new CngxOverlayRef<R>(cdkRef);

    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: CngxOverlayRef, useValue: ngxRef }],
    });

    const portal = new ComponentPortal(component, null, injector);
    cdkRef.attach(portal);
    return ngxRef;
  }
}

/** Provides `CngxOverlay` as an environment-scoped service. */
export function provideOverlay(): EnvironmentProviders {
  return makeEnvironmentProviders([CngxOverlay]);
}
