import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NavigationEnd, provideRouter, Router, RouterOutlet } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
import { CngxBreadcrumbSiblingsRouterSync } from './breadcrumb-siblings-router-sync.directive';
import type { CngxBreadcrumbSibling } from './breadcrumb.types';

@Component({ standalone: true, template: '' })
class Blank {}

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class Shell {}

/**
 * jsdom ships no `HTMLElement.showPopover` / `.hidePopover`; the siblings
 * component composes `CngxPopover`, which uses the native Popover API.
 */
function stubPopoverApi(): void {
  for (const name of ['showPopover', 'hidePopover'] as const) {
    if (!(name in HTMLElement.prototype)) {
      Object.defineProperty(HTMLElement.prototype, name, {
        configurable: true,
        writable: true,
        value: function () {},
      });
    }
  }
}

// Drains pending microtasks so the router's NavigationEnd propagates through
// toSignal before assertions. whenStable() hangs under Node 20 + zoneless with
// Router in providers (mirrors the trail router-sync spec).
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

const FALLBACK: readonly CngxBreadcrumbSibling[] = [{ label: 'FromInput', href: '/x' }];

@Component({
  standalone: true,
  selector: 'sib-router-host',
  imports: [CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsRouterSync, RouterOutlet],
  template: `
    <cngx-breadcrumb-siblings cngxRouterSync [depth]="1" [siblings]="fallback" />
    <router-outlet />
  `,
})
class SibRouterHost {
  readonly fallback = FALLBACK;
}

@Component({
  standalone: true,
  selector: 'sib-no-router-host',
  imports: [CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsRouterSync],
  template: `<cngx-breadcrumb-siblings cngxRouterSync [depth]="1" />`,
})
class SibNoRouterHost {}

describe('CngxBreadcrumbSiblingsRouterSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function rows(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('.cngx-breadcrumb__siblings-item'));
  }

  function rowLabels(root: HTMLElement): string[] {
    return rows(root).map((li) => li.textContent?.trim() ?? '');
  }

  async function mountRouted(): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<SibRouterHost>>;
    router: Router;
    directive: CngxBreadcrumbSiblingsRouterSync;
    root: HTMLElement;
  }> {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'eu',
            component: Shell,
            data: { breadcrumb: 'Region EU' },
            children: [
              { path: 'munich', component: Blank, data: { breadcrumb: 'Munich' } },
              { path: 'berlin', component: Blank, data: { breadcrumb: 'Berlin' } },
              { path: 'hamburg', component: Blank, data: { breadcrumb: 'Hamburg' } },
            ],
          },
        ]),
      ],
    });
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(SibRouterHost);
    fixture.detectChanges();
    await flushMicrotasks();
    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    const directive = fixture.debugElement
      .query(By.directive(CngxBreadcrumbSiblingsRouterSync))
      .injector.get(CngxBreadcrumbSiblingsRouterSync);
    return { fixture, router, directive, root };
  }

  it('derives the level siblings from the route tree, winning over [siblings]', async () => {
    const { fixture, router, root } = await mountRouted();

    await router.navigateByUrl('/eu/berlin');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    // Controlled source wins: the static [siblings]="FromInput" fallback is gone.
    expect(rowLabels(root)).toEqual(['Munich', 'Berlin', 'Hamburg']);
  });

  it('marks the active child current (aria-current, no link) and links the rest', async () => {
    const { fixture, router, root } = await mountRouted();

    await router.navigateByUrl('/eu/berlin');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const current = rows(root).find((li) => li.getAttribute('aria-current') === 'page');
    expect(current?.textContent?.trim()).toBe('Berlin');
    expect(current?.querySelector('a')).toBeNull();

    const munich = rows(root).find((li) => li.textContent?.trim() === 'Munich');
    expect(munich?.querySelector('a')?.getAttribute('href')).toBe('/eu/munich');
  });

  it('moves the current marker on navigation to a sibling', async () => {
    const { fixture, router, root } = await mountRouted();

    await router.navigateByUrl('/eu/berlin');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    await router.navigateByUrl('/eu/hamburg');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const current = rows(root).find((li) => li.getAttribute('aria-current') === 'page');
    expect(current?.textContent?.trim()).toBe('Hamburg');
    expect(rowLabels(root)).toEqual(['Munich', 'Berlin', 'Hamburg']);
  });

  it('keeps the same siblings() reference for a same-shape navigation, swaps it otherwise', async () => {
    const { router, directive } = await mountRouted();

    await router.navigateByUrl('/eu/berlin');
    await flushMicrotasks();
    const first = directive.siblings();

    // A NavigationEnd resolving to the identical set must not cascade: the
    // shape-based equal keeps the previous array reference.
    (router.events as unknown as { next: (e: unknown) => void }).next?.(
      new NavigationEnd(2, '/eu/berlin', '/eu/berlin'),
    );
    await flushMicrotasks();
    expect(directive.siblings()).toBe(first);

    // A genuine change (the active child moves) produces a new reference.
    await router.navigateByUrl('/eu/hamburg');
    await flushMicrotasks();
    const second = directive.siblings();
    expect(second).not.toBe(first);
    expect(second.find((s) => s.current)?.label).toBe('Hamburg');
  });

  it('is a graceful no-op (empty source) when Router is not provided', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    // The one-shot afterNextRender dev warning is not asserted (the render hook
    // does not deterministically flush for a directive on the OnPush host - same
    // reasoning as the trail router-sync spec). Spy only to keep output clean.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let directive!: CngxBreadcrumbSiblingsRouterSync;
    expect(() => {
      const fixture = TestBed.createComponent(SibNoRouterHost);
      fixture.detectChanges();
      directive = fixture.debugElement
        .query(By.directive(CngxBreadcrumbSiblingsRouterSync))
        .injector.get(CngxBreadcrumbSiblingsRouterSync);
    }).not.toThrow();

    expect(directive.siblings()).toEqual([]);
    warnSpy.mockRestore();
  });
});
