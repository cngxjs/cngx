import { Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxSidenav } from './sidenav';
import { CngxSidenavRouterSync } from './sidenav-router-sync.directive';
import { provideSidenavConfig } from './config/provide-sidenav-config';
import { withSidenavRouterSync } from './config/features';

@Component({
  template: `
    <cngx-sidenav cngxSidenavRouterSync [mode]="'over'" [param]="param()">x</cngx-sidenav>
  `,
  imports: [CngxSidenav, CngxSidenavRouterSync],
})
class Host {
  param = signal<string | undefined>(undefined);
}

async function flush(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

type NavExtras = { queryParams?: Record<string, string | null> };

function sidenavOf(fixture: ComponentFixture<Host>): CngxSidenav {
  return fixture.debugElement.query(By.directive(CngxSidenav)).componentInstance as CngxSidenav;
}

describe('CngxSidenavRouterSync', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('writes ?nav=open when the sidenav opens', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();
    expect(nav).not.toHaveBeenCalled();

    sidenavOf(fixture).open();
    fixture.detectChanges();
    await flush();

    expect(nav).toHaveBeenCalledTimes(1);
    expect((nav.mock.calls[0][1] as NavExtras).queryParams).toEqual({ nav: 'open' });
  });

  it('hydrates opened=true from an initial ?nav=open route', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    await router.navigate([], { queryParams: { nav: 'open' } });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();

    expect(sidenavOf(fixture).opened()).toBe(true);
  });

  it('removes the param when the sidenav closes', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();

    const sidenav = sidenavOf(fixture);
    sidenav.open();
    fixture.detectChanges();
    await flush();
    sidenav.close();
    fixture.detectChanges();
    await flush();

    expect(nav).toHaveBeenCalledTimes(2);
    expect((nav.mock.calls[1][1] as NavExtras).queryParams).toEqual({ nav: null });
  });

  it('migrates the key when [param] renames at runtime', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();

    sidenavOf(fixture).open();
    fixture.detectChanges();
    await flush();
    expect((nav.mock.calls[0][1] as NavExtras).queryParams).toEqual({ nav: 'open' });

    fixture.componentInstance.param.set('menu');
    fixture.detectChanges();
    await flush();

    expect(nav).toHaveBeenCalledTimes(2);
    expect((nav.mock.calls[1][1] as NavExtras).queryParams).toEqual({ nav: null, menu: 'open' });
  });

  it('resolves the param default from withSidenavRouterSync, per-instance [param] still wins', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideSidenavConfig(withSidenavRouterSync({ param: 'menu' }))],
    });

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await flush();

    const directive = fixture.debugElement
      .query(By.directive(CngxSidenavRouterSync))
      .injector.get(CngxSidenavRouterSync);
    expect(directive.param()).toBe('menu');

    fixture.componentInstance.param.set('side');
    fixture.detectChanges();
    await flush();
    expect(directive.param()).toBe('side');
  });
});
