import { Component, provideZonelessChangeDetection, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumbSiblings } from './breadcrumb-siblings.component';
import { CngxBreadcrumbSiblingItem } from './breadcrumb-sibling-item.directive';
import {
  CNGX_BREADCRUMB_SIBLINGS_SOURCE,
  type CngxBreadcrumbSiblingsSource,
} from './breadcrumb-siblings-source.token';
import type { CngxBreadcrumbSibling } from './breadcrumb.types';

/**
 * jsdom ships no `HTMLElement.showPopover` / `.hidePopover`; `CngxPopover`
 * uses the native Popover API, so the toggle throws without these stubs.
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

const CITIES: readonly CngxBreadcrumbSibling[] = [
  { label: 'Munich', href: '/eu/munich' },
  { label: 'Berlin', current: true },
  { label: 'Hamburg', href: '/eu/hamburg' },
];

@Component({
  standalone: true,
  selector: 'sib-host',
  imports: [CngxBreadcrumbSiblings],
  template: `
    <button id="sibling" type="button">sibling</button>
    <cngx-breadcrumb-siblings [siblings]="siblings()" />
  `,
})
class SibHost {
  readonly siblings = signal<readonly CngxBreadcrumbSibling[]>(CITIES);
}

@Component({
  standalone: true,
  selector: 'sib-slot-host',
  imports: [CngxBreadcrumbSiblings, CngxBreadcrumbSiblingItem],
  template: `
    <cngx-breadcrumb-siblings [siblings]="siblings">
      <ng-template cngxBreadcrumbSiblingItem let-sibling>
        <span class="custom-row">R: {{ sibling.label }}</span>
      </ng-template>
    </cngx-breadcrumb-siblings>
  `,
})
class SibSlotHost {
  readonly siblings = CITIES;
}

@Component({
  standalone: true,
  selector: 'sib-source-host',
  imports: [CngxBreadcrumbSiblings],
  template: `<cngx-breadcrumb-siblings [siblings]="staticSiblings" />`,
})
class SibSourceHost {
  readonly staticSiblings: readonly CngxBreadcrumbSibling[] = [{ label: 'FromInput', href: '/x' }];
}

describe('CngxBreadcrumbSiblings', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
  });

  function menuLabels(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]')).map(
      (li) => li.textContent?.trim() ?? '',
    );
  }

  it('renders the chevron trigger and lists the sibling labels', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(SibHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    const trigger = root.querySelector(
      'button.cngx-breadcrumb__siblings-trigger',
    ) as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-label')).toBe('Show sibling pages');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(menuLabels(root)).toEqual(['Munich', 'Berlin', 'Hamburg']);
  });

  it('marks the current sibling with aria-current="page" and renders no link', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(SibHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.cngx-breadcrumb__siblings-item'));
    const current = rows.find((li) => li.getAttribute('aria-current') === 'page');

    expect(current?.textContent?.trim()).toBe('Berlin');
    expect(current?.querySelector('a')).toBeNull();
    // Non-current siblings with an href render a link.
    const munich = rows.find((li) => li.textContent?.trim() === 'Munich');
    expect(munich?.querySelector('a')?.getAttribute('href')).toBe('/eu/munich');
    expect(munich?.getAttribute('aria-current')).toBeNull();
  });

  it('renders nothing when there are no siblings', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(SibHost);
    fixture.componentInstance.siblings.set([]);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    expect(root.querySelector('button.cngx-breadcrumb__siblings-trigger')).toBeNull();
    expect(root.querySelector('cngx-popover-panel')).toBeNull();
  });

  it('a projected item template overrides the default sibling row', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(SibSlotHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.custom-row')).map((el) =>
      el.textContent?.trim(),
    );
    expect(rows).toEqual(['R: Munich', 'R: Berlin', 'R: Hamburg']);
    expect(menuLabels(root)).toEqual(['R: Munich', 'R: Berlin', 'R: Hamburg']);
  });

  it('a provided source wins over the [siblings] input (controlled wins)', () => {
    const source: CngxBreadcrumbSiblingsSource = {
      siblings: signal<readonly CngxBreadcrumbSibling[]>([
        { label: 'Alpha', href: '/a' },
        { label: 'Beta', href: '/b' },
      ]) as Signal<readonly CngxBreadcrumbSibling[]>,
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_BREADCRUMB_SIBLINGS_SOURCE, useValue: source },
      ],
    });
    const fixture = TestBed.createComponent(SibSourceHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-siblings'))
      .nativeElement as HTMLElement;
    expect(menuLabels(root)).toEqual(['Alpha', 'Beta']);
  });
});
