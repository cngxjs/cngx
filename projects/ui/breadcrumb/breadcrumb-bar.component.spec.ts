import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumbBar } from './breadcrumb-bar.component';
import { CNGX_BREADCRUMB_ITEMS_SOURCE } from './breadcrumb-items-source.token';
import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

const TRAIL: readonly CngxBreadcrumbCrumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: 'Books', href: '/catalog/books' },
  { label: 'The Hobbit' },
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

  it('tracks crumbs by identity so a reordered trail re-marks the terminal', () => {
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
    // reopening it (no one-shot textContent read). Reuse the unchanged crumb
    // identities so the trail's track-by-identity only recreates the renamed one.
    host.items.set([TRAIL[0], { label: 'Katalog', href: '/catalog' }, TRAIL[2], TRAIL[3]]);
    fixture.detectChanges();
    expect(rows()).toEqual(['Katalog', 'Books']);
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
});
