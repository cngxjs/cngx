import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuFor } from './context-menu-for.directive';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
  }
}

interface Row {
  readonly id: number;
  readonly name: string;
}

@Component({
  template: `
    <div
      class="target"
      tabindex="0"
      [cngxContextMenuFor]="menu"
      [cngxContextMenuData]="data()"
      #trigger="cngxContextMenuFor"
    >
      Right-click
    </div>
    <cngx-context-menu ariaLabel="Actions" #menu="cngxContextMenu">
      <button type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor],
})
class DataHost {
  readonly data = signal<Row>({ id: 1, name: 'Alpha' });
}

@Component({
  template: `
    <div
      class="target"
      tabindex="0"
      [cngxContextMenuFor]="menu"
      [cngxContextMenuData]="data()"
      [cngxContextMenuResolve]="resolver()"
    >
      Right-click
    </div>
    <cngx-context-menu ariaLabel="Actions" #menu="cngxContextMenu">
      <button type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor],
})
class ResolverHost {
  readonly data = signal<Row>({ id: 1, name: 'FromData' });
  readonly resolver = signal<(event: MouseEvent) => Row | null>(() => ({ id: 9, name: 'FromResolver' }));
}

function rightClick(el: HTMLElement): MouseEvent {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 80,
  });
  el.dispatchEvent(event);
  return event;
}

describe('CngxContextMenuFor', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-context-menu-anchor, .cngx-menu-announcer')
      .forEach((el) => el.remove());
  });

  function setupData() {
    TestBed.configureTestingModule({ imports: [DataHost] });
    const fixture = TestBed.createComponent(DataHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
      .componentInstance as CngxContextMenu<Row>;
    return { fixture, target, panel };
  }

  function setupResolver() {
    TestBed.configureTestingModule({ imports: [ResolverHost] });
    const fixture = TestBed.createComponent(ResolverHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const host = fixture.componentInstance;
    const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
      .componentInstance as CngxContextMenu<Row>;
    return { fixture, target, host, panel };
  }

  it('data mode: opens with the fixed datum and prevents the native menu', () => {
    const { fixture, target, panel } = setupData();
    const event = rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(panel.popover.isVisible()).toBe(true);
    expect(panel.context()).toEqual({ id: 1, name: 'Alpha' });
  });

  it('resolver wins over data', () => {
    const { fixture, target, panel } = setupResolver();
    rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(panel.context()).toEqual({ id: 9, name: 'FromResolver' });
  });

  it('resolver null result leaves the native menu untouched', () => {
    const { fixture, target, host, panel } = setupResolver();
    host.resolver.set(() => null);
    fixture.detectChanges();
    const event = rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(panel.popover.isVisible()).toBe(false);
  });

  it('aria-haspopup=menu and aria-expanded track visibility as computeds', () => {
    const { fixture, target, panel } = setupData();
    expect(target.getAttribute('aria-haspopup')).toBe('menu');
    expect(target.getAttribute('aria-expanded')).toBe('false');

    rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(target.getAttribute('aria-expanded')).toBe('true');

    panel.popover.hide();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(target.getAttribute('aria-expanded')).toBe('false');
  });
});
