import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBreadcrumb } from './breadcrumb.directive';
import { CngxBreadcrumbItem } from './breadcrumb-item.directive';
import { CngxBreadcrumbSeparator } from './breadcrumb-separator.directive';
import { CNGX_BREADCRUMB } from './breadcrumb.token';

@Component({
  template: `<nav cngxBreadcrumb [maxVisible]="max()" #bc="cngxBreadcrumb">
    <ol>
      @for (crumb of crumbs(); track crumb; let last = $last) {
        <li><a cngxBreadcrumbItem [attr.href]="last ? null : '#'">{{ crumb }}</a></li>
        @if (!last) {
          <li cngxBreadcrumbSeparator>/</li>
        }
      }
    </ol>
  </nav>`,
  imports: [CngxBreadcrumb, CngxBreadcrumbItem, CngxBreadcrumbSeparator],
})
class Host {
  readonly crumbs = signal(['Home', 'Library', 'Authors', 'Tolkien', 'The Hobbit']);
  readonly max = signal<number | undefined>(undefined);
}

describe('CngxBreadcrumb', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxBreadcrumb));
    const bc = container.injector.get(CngxBreadcrumb);
    const items = (): HTMLElement[] =>
      fixture.debugElement
        .queryAll(By.directive(CngxBreadcrumbItem))
        .map((de) => de.nativeElement as HTMLElement);
    return { fixture, host: fixture.componentInstance, container, bc, items };
  }

  it('marks only the terminal crumb with aria-current="page"', () => {
    const { items } = setup();
    const els = items();
    expect(els.at(-1)?.getAttribute('aria-current')).toBe('page');
    expect(els.slice(0, -1).every((el) => el.getAttribute('aria-current') === null)).toBe(true);
  });

  it('provides CNGX_BREADCRUMB resolving to the coordinator instance', () => {
    const { container, bc } = setup();
    expect(container.injector.get(CNGX_BREADCRUMB)).toBe(bc);
  });

  it('names the landmark and hides separators from assistive tech', () => {
    const { container, fixture } = setup();
    expect(container.nativeElement.getAttribute('aria-label')).toBe('Breadcrumb');
    const seps = fixture.debugElement.queryAll(By.directive(CngxBreadcrumbSeparator));
    expect(seps.length).toBe(4);
    expect(seps.every((de) => de.nativeElement.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('keeps every crumb visible when maxVisible is unset', () => {
    const { items, bc } = setup();
    expect(bc.hasCollapsed()).toBe(false);
    expect(items().every((el) => !el.hasAttribute('hidden'))).toBe(true);
  });

  it('collapses the middle crumbs past maxVisible, keeping first + last (max-1)', () => {
    const { fixture, host, items, bc } = setup();
    host.max.set(3);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const els = items();
    expect(bc.hasCollapsed()).toBe(true);
    expect(bc.collapsedItems().length).toBe(2);
    // First and last two stay visible; indices 1 and 2 collapse.
    expect(els[0].hasAttribute('hidden')).toBe(false);
    expect(els[1].hasAttribute('hidden')).toBe(true);
    expect(els[2].hasAttribute('hidden')).toBe(true);
    expect(els[3].hasAttribute('hidden')).toBe(false);
    expect(els[4].hasAttribute('hidden')).toBe(false);
  });

  it('exposes the collapsed crumbs in DOM order for the overflow menu', () => {
    const { fixture, host } = setup();
    host.max.set(3);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.directive(CngxBreadcrumb));
    const bc = container.injector.get(CngxBreadcrumb);
    const itemDirs = fixture.debugElement
      .queryAll(By.directive(CngxBreadcrumbItem))
      .map((de) => de.injector.get(CngxBreadcrumbItem));

    expect(bc.collapsedItems()).toEqual([itemDirs[1], itemDirs[2]]);
  });
});
