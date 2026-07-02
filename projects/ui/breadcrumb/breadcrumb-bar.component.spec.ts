import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumbBar } from './breadcrumb-bar.component';
import { CngxBreadcrumbItemAccessory } from './breadcrumb-item-accessory.directive';
import { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
import { CngxBreadcrumbSiblingsRouterSync } from './breadcrumb-siblings-router-sync.directive';
import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
import type { CngxBreadcrumbCrumb, CngxBreadcrumbSibling } from './breadcrumb.types';

const TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Books', href: '/catalog/books' },
  { label: 'The Hobbit' },
];

const CITY_SIBLINGS: readonly CngxBreadcrumbSibling[] = [
  { label: 'Berlin', current: true },
  { label: 'Munich', href: '/catalog/munich' },
  { label: 'Hamburg', href: '/catalog/hamburg' },
];

@Component({
  standalone: true,
  selector: 'bar-host',
  imports: [CngxBreadcrumbBar],
  template: `
    <cngx-breadcrumb
      [items]="items()"
      [maxVisible]="maxVisible()"
      [label]="label()"
      [variant]="variant()"
    />
  `,
})
class BarHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
  readonly maxVisible = signal<number | undefined>(undefined);
  readonly label = signal('Breadcrumb');
  readonly variant = signal<string | undefined>(undefined);
}

const ROUTER_TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Router', href: '/r' },
  { label: 'Derived' },
];

@Component({
  standalone: true,
  selector: 'seam-host',
  imports: [CngxBreadcrumbBar],
  providers: [
    { provide: CNGX_BREADCRUMB_ITEMS_SOURCE, useValue: { crumbs: signal(ROUTER_TRAIL) } },
  ],
  template: `<cngx-breadcrumb [items]="items()" />`,
})
class SeamHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

/** jsdom ships no native Popover API; the rendered overflow panel needs it stubbed. */
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

describe('CngxBreadcrumbBar', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<BarHost>>;
    host: BarHost;
    barEl: HTMLElement;
    navEl: HTMLElement;
    links: () => HTMLAnchorElement[];
  } {
    const fixture = TestBed.createComponent(BarHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;
    const navEl = barEl.querySelector('nav') as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      barEl,
      navEl,
      links: () => Array.from(barEl.querySelectorAll<HTMLAnchorElement>('a.cngx-breadcrumb__link')),
    };
  }

  it('renders one crumb per item from [items]', () => {
    const { links } = setup();
    expect(links().map((a) => a.textContent?.trim())).toEqual([
      'Home',
      'Catalog',
      'Books',
      'The Hobbit',
    ]);
  });

  it('marks the terminal crumb aria-current="page" and drops its href', () => {
    const { links } = setup();
    const anchors = links();
    expect(anchors.at(-1)?.getAttribute('aria-current')).toBe('page');
    expect(anchors.at(-1)?.hasAttribute('href')).toBe(false);
    expect(anchors[0].getAttribute('aria-current')).toBeNull();
    expect(anchors[0].getAttribute('href')).toBe('/');
  });

  it('names the nav landmark from the label input', () => {
    const { fixture, host, navEl } = setup();
    expect(navEl.getAttribute('aria-label')).toBe('Breadcrumb');
    host.label.set('You are here');
    fixture.detectChanges();
    expect(navEl.getAttribute('aria-label')).toBe('You are here');
  });

  it('collapses the middle past maxVisible (collapsed items are hidden)', () => {
    const { fixture, host, links } = setup();
    expect(links().some((a) => a.hasAttribute('hidden'))).toBe(false);

    host.maxVisible.set(2);
    fixture.detectChanges();

    const hidden = links().filter((a) => a.hasAttribute('hidden'));
    expect(hidden.length).toBeGreaterThan(0);
    // First and terminal crumbs stay visible; middle collapses.
    expect(links()[0].hasAttribute('hidden')).toBe(false);
    expect(links().at(-1)?.hasAttribute('hidden')).toBe(false);
  });

  it('tracks crumbs by stable key (href|label) so a reordered trail re-marks the terminal', () => {
    const { fixture, host, links } = setup();
    expect(links().at(-1)?.textContent?.trim()).toBe('The Hobbit');

    host.items.set([...TRAIL].reverse());
    fixture.detectChanges();

    const anchors = links();
    expect(anchors[0].textContent?.trim()).toBe('The Hobbit');
    expect(anchors.at(-1)?.textContent?.trim()).toBe('Home');
    expect(anchors.at(-1)?.getAttribute('aria-current')).toBe('page');
    expect(anchors[0].getAttribute('aria-current')).toBeNull();
  });

  it('reflects the variant input as a host class', () => {
    const { fixture, host, barEl } = setup();
    expect(barEl.classList.contains('cngx-breadcrumb')).toBe(true);
    expect(barEl.className).not.toContain('cngx-breadcrumb--');

    host.variant.set('pill');
    fixture.detectChanges();
    expect(barEl.classList.contains('cngx-breadcrumb--pill')).toBe(true);
    expect(barEl.classList.contains('cngx-breadcrumb')).toBe(true);
  });

  it('renders the overflow after the first crumb only when the trail collapses', () => {
    const { fixture, host, barEl, navEl } = setup();
    expect(barEl.querySelector('cngx-breadcrumb-overflow')).toBeNull();

    host.maxVisible.set(2);
    fixture.detectChanges();

    const overflow = navEl.querySelector('cngx-breadcrumb-overflow');
    expect(overflow).toBeTruthy();
    // The overflow slots in right after the first crumb's list item.
    const items = Array.from(navEl.querySelectorAll<HTMLElement>('.cngx-breadcrumb__list > li'));
    const firstCrumb = items.findIndex((li) => li.querySelector('a.cngx-breadcrumb__link'));
    const overflowIdx = items.findIndex((li) => li.querySelector('cngx-breadcrumb-overflow'));
    expect(overflowIdx).toBeGreaterThan(firstCrumb);
    expect(items[firstCrumb].querySelector('a')?.textContent?.trim()).toBe('Home');
  });

  it('lists the collapsed labels in the overflow menu and updates them reactively', () => {
    const { fixture, host, barEl } = setup();
    host.maxVisible.set(2);
    fixture.detectChanges();

    const rows = (): (string | undefined)[] =>
      Array.from(barEl.querySelectorAll<HTMLElement>('.cngx-breadcrumb__overflow-item')).map((li) =>
        li.textContent?.trim(),
      );
    expect(rows()).toEqual(['Catalog', 'Books']);

    // The bar binds [cngxBreadcrumbItemLabel], so the overflow row reads the
    // reactive label input; renaming a collapsed crumb updates the menu without
    // reopening it (no one-shot textContent read). Keeping the href '/catalog'
    // keeps the track key stable, so the trail reuses the same node and the
    // label binding updates in place.
    host.items.set([TRAIL[0], { label: 'Katalog', href: '/catalog' }, TRAIL[2], TRAIL[3]]);
    fixture.detectChanges();
    expect(rows()).toEqual(['Katalog', 'Books']);
  });

  it('auto-renders a siblings dropdown inside the crumb that carries siblings', () => {
    const { fixture, host, barEl } = setup();
    expect(barEl.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeNull();

    host.items.set([TRAIL[0], { ...TRAIL[1], siblings: CITY_SIBLINGS }, TRAIL[2], TRAIL[3]]);
    fixture.detectChanges();

    const trigger = barEl.querySelector<HTMLButtonElement>('button.cngx-breadcrumb__siblings-trigger');
    expect(trigger).toBeTruthy();
    // The dropdown lives inside the owning crumb's <li>, next to its link.
    const owningLi = trigger?.closest('li.cngx-breadcrumb__crumb');
    expect(owningLi?.querySelector('a.cngx-breadcrumb__link')?.textContent?.trim()).toBe('Catalog');
  });

  it('renders no trigger for a crumb without siblings or with an empty array', () => {
    const { fixture, host, barEl } = setup();
    // Default trail: no crumb carries siblings.
    expect(barEl.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeNull();

    // An empty array renders nothing and does not even instantiate the dropdown -
    // the length gate skips it, so no trigger and no host element appear.
    host.items.set([TRAIL[0], { ...TRAIL[1], siblings: [] }, TRAIL[2], TRAIL[3]]);
    fixture.detectChanges();
    expect(barEl.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeNull();
    expect(barEl.querySelector('cngx-breadcrumb-siblings')).toBeNull();
  });

  it('marks the current sibling aria-current="page"', () => {
    const { fixture, host, barEl } = setup();
    host.items.set([TRAIL[0], { ...TRAIL[1], siblings: CITY_SIBLINGS }, TRAIL[2], TRAIL[3]]);
    fixture.detectChanges();

    const rows = Array.from(
      barEl.querySelectorAll<HTMLElement>('li.cngx-breadcrumb__siblings-item'),
    );
    const current = rows.filter((li) => li.getAttribute('aria-current') === 'page');
    expect(current.length).toBe(1);
    expect(current[0].textContent?.trim()).toBe('Berlin');
  });

  it('hides a collapsed crumb\'s siblings with the crumb (display:none on the <li>, not removal)', () => {
    const { fixture, host, barEl } = setup();
    // Siblings on a middle crumb (Catalog) that collapses at maxVisible=2.
    host.items.set([TRAIL[0], { ...TRAIL[1], siblings: CITY_SIBLINGS }, TRAIL[2], TRAIL[3]]);
    host.maxVisible.set(2);
    fixture.detectChanges();

    const trigger = barEl.querySelector<HTMLButtonElement>('button.cngx-breadcrumb__siblings-trigger');
    // Collapse is display:none on the ancestor <li>, never DOM removal.
    expect(trigger).toBeTruthy();
    const owningLi = trigger?.closest<HTMLElement>('li.cngx-breadcrumb__crumb');
    expect(owningLi?.style.display).toBe('none');
  });

  it('a provided CNGX_BREADCRUMB_ITEMS_SOURCE wins over the [items] input', () => {
    const fixture = TestBed.createComponent(SeamHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;
    const labels = Array.from(
      barEl.querySelectorAll<HTMLAnchorElement>('a.cngx-breadcrumb__link'),
    ).map((a) => a.textContent?.trim());
    expect(labels).toEqual(['Router', 'Derived']);
  });

  it('projects the accessory slot once per crumb with the { crumb, index } context', () => {
    const fixture = TestBed.createComponent(AccessoryHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;

    const markers = Array.from(barEl.querySelectorAll<HTMLElement>('.acc-marker'));
    expect(markers.length).toBe(TRAIL.length);
    expect(markers.map((m) => m.dataset['label'])).toEqual([
      'Home',
      'Catalog',
      'Books',
      'The Hobbit',
    ]);
    expect(markers.map((m) => m.dataset['index'])).toEqual(['0', '1', '2', '3']);
  });

  it('lets the accessory slot win over a crumb\'s declarative siblings', () => {
    const fixture = TestBed.createComponent(AccessoryHost);
    fixture.componentInstance.items.set([
      TRAIL[0],
      { ...TRAIL[1], siblings: CITY_SIBLINGS },
      TRAIL[2],
      TRAIL[3],
    ]);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;

    // Slot present: the declarative auto-render is suppressed for every crumb.
    expect(barEl.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeNull();
    expect(barEl.querySelectorAll('.acc-marker').length).toBe(TRAIL.length);
  });
});

@Component({
  standalone: true,
  selector: 'accessory-host',
  imports: [CngxBreadcrumbBar, CngxBreadcrumbItemAccessory],
  template: `
    <cngx-breadcrumb [items]="items()">
      <ng-template cngxBreadcrumbItemAccessory let-crumb let-index="index">
        <span class="acc-marker" [attr.data-label]="crumb.label" [attr.data-index]="index"></span>
      </ng-template>
    </cngx-breadcrumb>
  `,
})
class AccessoryHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

@Component({ standalone: true, template: '' })
class Blank {}

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class RouteShell {}

@Component({
  standalone: true,
  selector: 'accessory-router-host',
  imports: [
    CngxBreadcrumbBar,
    CngxBreadcrumbItemAccessory,
    CngxBreadcrumbSiblings,
    CngxBreadcrumbSiblingsRouterSync,
    RouterOutlet,
  ],
  template: `
    <cngx-breadcrumb [items]="items()">
      <ng-template cngxBreadcrumbItemAccessory>
        <cngx-breadcrumb-siblings cngxRouterSync [depth]="1" />
      </ng-template>
    </cngx-breadcrumb>
    <router-outlet />
  `,
})
class AccessoryRouterHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

// whenStable() hangs under Node 20 + zoneless with Router in providers, so drain
// microtasks by hand to let NavigationEnd propagate through toSignal.
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe('CngxBreadcrumbBar accessory slot - router-driven source', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          {
            path: 'eu',
            component: RouteShell,
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
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('carries a router-driven siblings dropdown that provides its own source', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AccessoryRouterHost);
    fixture.detectChanges();
    await flushMicrotasks();

    await router.navigateByUrl('/eu/berlin');
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;
    // The router source populated the level siblings, so the dropdown self-shows.
    expect(barEl.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeTruthy();
    const current = Array.from(
      barEl.querySelectorAll<HTMLElement>('.cngx-breadcrumb__siblings-item'),
    ).find((li) => li.getAttribute('aria-current') === 'page');
    expect(current?.textContent?.trim()).toBe('Berlin');
  });
});
