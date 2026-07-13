import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumbBar } from './breadcrumb-bar.component';
import { CngxBreadcrumbIcon } from './breadcrumb-icon.directive';
import { CngxBreadcrumbItemAccessory } from './breadcrumb-item-accessory.directive';
import { CngxBreadcrumbOverflowItem } from './breadcrumb-overflow-item.directive';
import { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
import { CngxBreadcrumbSiblingsRouterSync } from './breadcrumb-siblings-router-sync.directive';
import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
import type { CngxBreadcrumbSkin } from './config/breadcrumb.config';
import { withBreadcrumbAriaLabels, withBreadcrumbSkin } from './config/features';
import { provideBreadcrumbConfig } from './config/provide-breadcrumb-config';
import type { CngxBreadcrumbCrumb, CngxBreadcrumbSibling } from './breadcrumb.types';

const TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Books', href: '/catalog/books' },
  { label: 'The Hobbit' },
];

const ICON_TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Catalog', href: '/catalog', icon: 'folder' },
  { label: 'Books', href: '/catalog/books', icon: 'menu_book' },
  { label: 'The Hobbit', icon: 'description' },
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
      [skin]="skin()"
    />
  `,
})
class BarHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
  readonly maxVisible = signal<number | undefined>(undefined);
  readonly label = signal('Breadcrumb');
  readonly skin = signal<CngxBreadcrumbSkin | undefined>(undefined);
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

/**
 * The bar mounts a {@link CngxResizeObserver} hostDirective, but jsdom ships no
 * `ResizeObserver`. This file-scoped fake keeps every bar test from throwing on
 * `new win.ResizeObserver`; it registers each observer so the responsive suite
 * below can drive a synthetic width. Observers that are never emitted stay at
 * `width()==0` / `isReady()==false`, so non-responsive tests behave exactly as
 * before.
 */
const resizeInstances: { emit: (width: number) => void }[] = [];
let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;

class FakeResizeObserver {
  constructor(cb: (entries: ResizeObserverEntry[]) => void) {
    resizeInstances.push({
      emit: (width) => cb([{ contentRect: { width } } as ResizeObserverEntry]),
    });
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  originalResizeObserver = globalThis.ResizeObserver;
  (globalThis as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
});

afterAll(() => {
  (globalThis as { ResizeObserver: unknown }).ResizeObserver = originalResizeObserver;
});

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

  it('reflects the resolved skin onto [data-skin] (default classic)', () => {
    const { fixture, host, barEl } = setup();
    expect(barEl.classList.contains('cngx-breadcrumb')).toBe(true);
    // Input unset resolves to the 'classic' cascade default.
    expect(barEl.getAttribute('data-skin')).toBe('classic');

    host.skin.set('pill');
    fixture.detectChanges();
    expect(barEl.getAttribute('data-skin')).toBe('pill');
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

  it('forwards a projected *cngxBreadcrumbOverflowItem into the composed overflow', () => {
    const fixture = TestBed.createComponent(OverflowRowHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;

    // TRAIL = Home / Catalog / Books / The Hobbit; maxVisible=2 collapses the middle two.
    const rows = Array.from(barEl.querySelectorAll<HTMLElement>('.ov-custom')).map((el) =>
      el.textContent?.trim(),
    );
    expect(rows).toEqual(['Catalog', 'Books']);
  });

  it('renders the *cngxBreadcrumbIcon slot once per crumb inside the link, leading the label span', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;

    const markers = Array.from(barEl.querySelectorAll<HTMLElement>('.icon-marker'));
    expect(markers.length).toBe(ICON_TRAIL.length);
    for (const marker of markers) {
      const link = marker.closest('a.cngx-breadcrumb__link');
      expect(link).toBeTruthy();
      const label = link?.querySelector('span.cngx-breadcrumb__label');
      expect(label).toBeTruthy();
      // The icon marker precedes the label span in DOM order (leading icon).
      expect(
        marker.compareDocumentPosition(label as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('passes the { crumb, index } context (crumb.icon from [items]) to the icon slot', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;

    const markers = Array.from(barEl.querySelectorAll<HTMLElement>('.icon-marker'));
    expect(markers.map((m) => m.dataset['index'])).toEqual(['0', '1', '2', '3']);
    expect(markers.map((m) => m.dataset['icon'])).toEqual([
      'home',
      'folder',
      'menu_book',
      'description',
    ]);
  });

  it('wraps every label in a .cngx-breadcrumb__label span with the link data-label, and renders no icon markup when the slot is unset', () => {
    const { links, barEl } = setup();
    const anchors = links();
    for (const a of anchors) {
      const label = a.querySelector('span.cngx-breadcrumb__label');
      expect(label?.textContent?.trim()).toBe(a.getAttribute('data-label'));
    }
    // BarHost projects no icon slot, so nothing extra renders inside the links.
    expect(barEl.querySelector('.icon-marker')).toBeNull();
  });

  it('keeps the label in the DOM as the accessible name under the icononly skin (visually hidden, not removed)', () => {
    const { fixture, host, barEl, links } = setup();
    host.skin.set('icononly');
    fixture.detectChanges();

    expect(barEl.getAttribute('data-skin')).toBe('icononly');
    const anchors = links();
    expect(anchors.length).toBe(TRAIL.length);
    for (const a of anchors) {
      // The label span and the [data-label] the CSS tooltip reads both persist -
      // icononly hides the label visually via @scope, it never drops it (Pillar 2).
      const label = a.querySelector('span.cngx-breadcrumb__label');
      expect(label?.textContent?.trim()).toBe(a.getAttribute('data-label'));
    }
    expect(anchors.at(-1)?.getAttribute('aria-current')).toBe('page');
  });

  it('reflects the shell skin onto [data-skin]', () => {
    const { fixture, host, barEl } = setup();
    host.skin.set('shell');
    fixture.detectChanges();
    expect(barEl.getAttribute('data-skin')).toBe('shell');
  });

  it('reflects the record skin onto [data-skin]', () => {
    const { fixture, host, barEl } = setup();
    host.skin.set('record');
    fixture.detectChanges();
    expect(barEl.getAttribute('data-skin')).toBe('record');
  });
});

@Component({
  standalone: true,
  selector: 'overflow-row-host',
  imports: [CngxBreadcrumbBar, CngxBreadcrumbOverflowItem],
  template: `
    <cngx-breadcrumb [items]="items()" [maxVisible]="2">
      <ng-template cngxBreadcrumbOverflowItem let-crumb>
        <span class="ov-custom">{{ crumb.resolvedLabel() }}</span>
      </ng-template>
    </cngx-breadcrumb>
  `,
})
class OverflowRowHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

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

@Component({
  standalone: true,
  selector: 'icon-host',
  imports: [CngxBreadcrumbBar, CngxBreadcrumbIcon],
  template: `
    <cngx-breadcrumb [items]="items()">
      <ng-template cngxBreadcrumbIcon let-crumb let-index="index">
        <span class="icon-marker" [attr.data-icon]="crumb.icon" [attr.data-index]="index"></span>
      </ng-template>
    </cngx-breadcrumb>
  `,
})
class IconHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(ICON_TRAIL);
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

@Component({
  standalone: true,
  selector: 'bar-cascade-host',
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items()" />`,
})
class BarCascadeHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

@Component({
  standalone: true,
  selector: 'bar-cascade-override-host',
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items()" label="Explicit trail" />`,
})
class BarCascadeOverrideHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
}

describe('CngxBreadcrumbBar config cascade', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: 'Navigation trail' })),
      ],
    });
  });

  it('names the nav landmark from the config cascade when no [label] is bound', () => {
    const fixture = TestBed.createComponent(BarCascadeHost);
    fixture.detectChanges();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Navigation trail');
  });

  it('lets an explicit [label] win over the config cascade', () => {
    const fixture = TestBed.createComponent(BarCascadeOverrideHost);
    fixture.detectChanges();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Explicit trail');
  });
});

@Component({
  standalone: true,
  selector: 'bar-skin-cascade-host',
  imports: [CngxBreadcrumbBar],
  template: `<cngx-breadcrumb [items]="items()" [skin]="skin()" />`,
})
class BarSkinCascadeHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
  readonly skin = signal<CngxBreadcrumbSkin | undefined>(undefined);
}

@Component({
  standalone: true,
  selector: 'bar-responsive-host',
  imports: [CngxBreadcrumbBar],
  template: `
    <cngx-breadcrumb
      [items]="items()"
      [responsive]="responsive()"
      [maxVisible]="maxVisible()"
    />
  `,
})
class BarResponsiveHost {
  readonly items = signal<readonly CngxBreadcrumbCrumb[]>(TRAIL);
  readonly responsive = signal(false);
  readonly maxVisible = signal<number | undefined>(undefined);
}

/**
 * jsdom fires no real ResizeObserver, so the bar's width source is the file-scoped
 * fake whose captured callback the test drives with a synthetic content-box width.
 * That exercises the live `resolveBreadcrumbTier` -> `autoMaxVisible` wiring
 * without a browser (the real observer path is the Phase 2 e2e).
 */
describe('CngxBreadcrumbBar responsive (width-derived maxVisible)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
    resizeInstances.length = 0;
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  function mount(): {
    fixture: ReturnType<typeof TestBed.createComponent<BarResponsiveHost>>;
    host: BarResponsiveHost;
    barEl: HTMLElement;
    emit: (width: number) => void;
    collapsed: () => boolean;
  } {
    const fixture = TestBed.createComponent(BarResponsiveHost);
    fixture.detectChanges();
    const barEl = fixture.debugElement.query(By.css('cngx-breadcrumb')).nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      barEl,
      // The bar mounts exactly one ResizeObserver hostDirective.
      emit: (width) => {
        resizeInstances.at(-1)?.emit(width);
        fixture.detectChanges();
      },
      // The overflow element renders only when the trail collapses.
      collapsed: () => barEl.querySelector('cngx-breadcrumb-overflow') !== null,
    };
  }

  it('derives maxVisible from the observed width via resolveBreadcrumbTier', () => {
    const { host, emit, collapsed } = mount();
    host.responsive.set(true);

    // Wide: TRAIL (4 crumbs) fits the 6-cap tier, no collapse.
    emit(700);
    expect(collapsed()).toBe(false);

    // Narrow: the 2-cap tier collapses the middle into the overflow.
    emit(300);
    expect(collapsed()).toBe(true);
  });

  it('lets an explicit [maxVisible] win over the width-derived value', () => {
    const { host, emit, collapsed } = mount();
    host.responsive.set(true);
    host.maxVisible.set(6);

    // Narrow width would resolve to 2 (collapse), but the explicit 6 wins -> no collapse.
    emit(300);
    expect(collapsed()).toBe(false);
  });

  it('never collapses from width when responsive is unset (current default behaviour)', () => {
    const { emit, collapsed } = mount();
    // responsive stays false; even a narrow width leaves the width path gated off.
    emit(300);
    expect(collapsed()).toBe(false);
  });
});

describe('CngxBreadcrumbBar skin cascade', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideBreadcrumbConfig(withBreadcrumbSkin('pill')),
      ],
    });
  });

  function skinOf(fixture: ReturnType<typeof TestBed.createComponent<BarSkinCascadeHost>>): string | null {
    const bar = (fixture.nativeElement as HTMLElement).querySelector('cngx-breadcrumb') as HTMLElement;
    return bar.getAttribute('data-skin');
  }

  it('resolves [data-skin] from the config cascade when no [skin] is bound', () => {
    const fixture = TestBed.createComponent(BarSkinCascadeHost);
    fixture.detectChanges();
    expect(skinOf(fixture)).toBe('pill');
  });

  it('lets an explicit [skin] win over the config cascade', () => {
    const fixture = TestBed.createComponent(BarSkinCascadeHost);
    fixture.componentInstance.skin.set('contained');
    fixture.detectChanges();
    expect(skinOf(fixture)).toBe('contained');
  });
});
