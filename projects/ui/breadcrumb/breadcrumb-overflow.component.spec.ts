import { Component, computed, provideZonelessChangeDetection, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_BREADCRUMB, type CngxBreadcrumbHost, type CngxBreadcrumbItem } from '@cngx/common/interactive';

import { CngxBreadcrumbOverflow } from './breadcrumb-overflow.component';
import { CngxBreadcrumbOverflowItem } from './breadcrumb-overflow-item.directive';

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

async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

function fakeCrumb(label: string): CngxBreadcrumbItem {
  return { resolvedLabel: () => label } as unknown as CngxBreadcrumbItem;
}

function makeHost(labels: string[]): {
  host: CngxBreadcrumbHost;
  collapsed: WritableSignal<readonly CngxBreadcrumbItem[]>;
} {
  const collapsed = signal<readonly CngxBreadcrumbItem[]>(labels.map(fakeCrumb));
  const host: CngxBreadcrumbHost = {
    isTerminal: () => false,
    isCollapsed: () => false,
    collapsedItems: collapsed,
    hasCollapsed: computed(() => collapsed().length > 0),
  };
  return { host, collapsed };
}

@Component({
  standalone: true,
  selector: 'ov-host',
  imports: [CngxBreadcrumbOverflow],
  template: `
    <button id="sibling" type="button">sibling</button>
    <cngx-breadcrumb-overflow />
  `,
})
class OvHost {}

@Component({
  standalone: true,
  selector: 'ov-slot-host',
  imports: [CngxBreadcrumbOverflow, CngxBreadcrumbOverflowItem],
  template: `
    <cngx-breadcrumb-overflow>
      <ng-template cngxBreadcrumbOverflowItem let-crumb>
        <span class="custom-row">R: {{ crumb.resolvedLabel() }}</span>
      </ng-template>
    </cngx-breadcrumb-overflow>
  `,
})
class OvSlotHost {}

describe('CngxBreadcrumbOverflow', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubPopoverApi();
  });

  function labels(root: HTMLElement): string[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]')).map((li) =>
      li.textContent?.trim() ?? '',
    );
  }

  it('renders the ellipsis trigger and lists the collapsed labels', () => {
    const { host } = makeHost(['Catalog', 'Books']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: CNGX_BREADCRUMB, useValue: host }],
    });
    const fixture = TestBed.createComponent(OvHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-overflow'))
      .nativeElement as HTMLElement;
    const trigger = root.querySelector('button.cngx-breadcrumb__overflow-trigger') as HTMLButtonElement;

    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-label')).toBe('Show collapsed breadcrumbs');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(labels(root)).toEqual(['Catalog', 'Books']);
  });

  it('opens the panel on click and restores focus to the trigger on close', async () => {
    const { host } = makeHost(['Catalog', 'Books']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: CNGX_BREADCRUMB, useValue: host }],
    });
    const fixture = TestBed.createComponent(OvHost);
    fixture.detectChanges();

    const rootEl = fixture.nativeElement as HTMLElement;
    const trigger = rootEl.querySelector('button.cngx-breadcrumb__overflow-trigger') as HTMLButtonElement;
    const sibling = rootEl.querySelector('#sibling') as HTMLButtonElement;

    // Focus the trigger first so it is the element the menu-button pattern
    // restores to after the menu closes.
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    // Focus moves away; closing the menu must restore it to the trigger.
    sibling.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await flushMicrotasks();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('renders nothing when no crumb is collapsed', () => {
    const { host } = makeHost([]);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: CNGX_BREADCRUMB, useValue: host }],
    });
    const fixture = TestBed.createComponent(OvHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-overflow'))
      .nativeElement as HTMLElement;
    expect(root.querySelector('button.cngx-breadcrumb__overflow-trigger')).toBeNull();
    expect(root.querySelector('cngx-popover-panel')).toBeNull();
  });

  it('a projected item template overrides the default label row', () => {
    const { host } = makeHost(['Catalog', 'Books']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: CNGX_BREADCRUMB, useValue: host }],
    });
    const fixture = TestBed.createComponent(OvSlotHost);
    fixture.detectChanges();

    const root = fixture.debugElement.query(By.css('cngx-breadcrumb-overflow'))
      .nativeElement as HTMLElement;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('.custom-row')).map((el) =>
      el.textContent?.trim(),
    );
    expect(rows).toEqual(['R: Catalog', 'R: Books']);
    expect(labels(root)).toEqual(['R: Catalog', 'R: Books']);
  });
});
