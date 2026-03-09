import {
  ComponentRef,
  Injectable,
  Injector,
  Type,
  inject,
} from '@angular/core';
import {
  Overlay,
  OverlayConfig,
  OverlayRef as CdkOverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgxOverlayRef } from './overlay-ref';

export interface NgxOverlayConfig extends Partial<OverlayConfig> {
  hasBackdrop?: boolean;
}

/**
 * Thin service over CDK Overlay that returns a typed NgxOverlayRef.
 *
 * @example
 * const ref = overlayService.open(MyComponent, { hasBackdrop: true });
 * ref.afterClosed$.subscribe(result => console.log(result));
 */
@Injectable({ providedIn: 'root' })
export class NgxOverlayService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  open<C, R = unknown>(
    component: Type<C>,
    config: NgxOverlayConfig = {},
  ): NgxOverlayRef<R> {
    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      ...config,
    });

    const cdkRef: CdkOverlayRef = this.overlay.create(overlayConfig);
    const ngxRef = new NgxOverlayRef<R>(cdkRef);

    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: NgxOverlayRef, useValue: ngxRef }],
    });

    const portal = new ComponentPortal(component, null, injector);
    const _componentRef: ComponentRef<C> = cdkRef.attach(portal);
    console.info(_componentRef);
    return ngxRef;
  }
}
