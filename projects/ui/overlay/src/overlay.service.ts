import { Injectable, Injector, inject } from '@angular/core';
import { type ComponentRef, type Type } from '@angular/core';
import { Overlay, OverlayConfig, type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CngxOverlayRef } from './overlay-ref';

export interface CngxOverlayConfig extends Partial<OverlayConfig> {
  hasBackdrop?: boolean;
}

/**
 * Thin service over CDK Overlay that returns a typed CngxOverlayRef.
 *
 * @example
 * const ref = overlayService.open(MyComponent, { hasBackdrop: true });
 * ref.afterClosed$.subscribe(result => console.log(result));
 */
@Injectable({ providedIn: 'root' })
export class CngxOverlay {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

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
    const _componentRef: ComponentRef<C> = cdkRef.attach(portal);
    console.info(_componentRef);
    return ngxRef;
  }
}
