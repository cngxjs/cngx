import { Component, inject } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxOverlay, provideOverlay } from './overlay.service';
import { CngxOverlayRef } from './overlay-ref';

@Component({ selector: 'overlay-content', standalone: true, template: 'content' })
class OverlayContent {
  readonly ref = inject(CngxOverlayRef);
}

describe('CngxOverlay', () => {
  let service: CngxOverlay;
  let overlay: Overlay;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideOverlay()] });
    service = TestBed.inject(CngxOverlay);
    overlay = TestBed.inject(Overlay);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('provideOverlay makes CngxOverlay injectable', () => {
    expect(service).toBeInstanceOf(CngxOverlay);
  });

  it('open returns a typed CngxOverlayRef', () => {
    const ref = service.open(OverlayContent);
    expect(ref).toBeInstanceOf(CngxOverlayRef);
    ref.close();
  });

  it('provides the ref to the attached component through DI', () => {
    const create = vi.spyOn(overlay, 'create');
    const ref = service.open(OverlayContent);
    const cdkRef = create.mock.results[0].value as ReturnType<Overlay['create']>;
    const attached = cdkRef.hasAttached();
    expect(attached).toBe(true);
    ref.close();
  });

  it('defaults to a backdropped, centered panel', () => {
    const create = vi.spyOn(overlay, 'create');
    const ref = service.open(OverlayContent);
    const config = create.mock.calls[0][0] as OverlayConfig;
    expect(config.hasBackdrop).toBe(true);
    expect(config.positionStrategy).toBeTruthy();
    ref.close();
  });

  it('merges caller config over the defaults', () => {
    const create = vi.spyOn(overlay, 'create');
    const ref = service.open(OverlayContent, { hasBackdrop: false, panelClass: 'my-panel' });
    const config = create.mock.calls[0][0] as OverlayConfig;
    expect(config.hasBackdrop).toBe(false);
    expect(config.panelClass).toBe('my-panel');
    ref.close();
  });

  it('keeps the cngx-only disableClose out of the CDK OverlayConfig', () => {
    const create = vi.spyOn(overlay, 'create');
    const ref = service.open(OverlayContent, { disableClose: true, panelClass: 'p' });
    const config = create.mock.calls[0][0] as OverlayConfig;
    expect('disableClose' in config).toBe(false);
    expect(config.panelClass).toBe('p');
    ref.close();
  });

  it('restores focus to the opener when the overlay closes', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const ref = service.open(OverlayContent);
    opener.blur();
    ref.close();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('closes still-open overlays when the providing scope is destroyed', () => {
    @Component({ standalone: true, template: '', providers: [CngxOverlay] })
    class ScopedHost {
      readonly svc = inject(CngxOverlay);
    }
    const fixture = TestBed.createComponent(ScopedHost);
    const scoped = fixture.componentInstance.svc;
    const ref = scoped.open(OverlayContent);
    expect(ref.isOpen()).toBe(true);
    fixture.destroy();
    expect(ref.isOpen()).toBe(false);
  });
});
