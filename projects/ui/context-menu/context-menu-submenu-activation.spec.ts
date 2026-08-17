import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuContent } from './context-menu-content.directive';
import { CngxContextMenuFor } from './context-menu-for.directive';
import { CngxContextMenuItem } from './context-menu-item.component';

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

@Component({
  template: `
    <div class="target" tabindex="0" [cngxContextMenuFor]="parent">Right-click</div>

    <cngx-context-menu ariaLabel="Actions" #parent="cngxContextMenu">
      <cngx-context-menu-item value="export" [submenu]="sub" (select)="parentSelects.set(parentSelects() + 1)">
        Export
      </cngx-context-menu-item>
      <cngx-context-menu-item value="copy" (select)="leafSelects.set(leafSelects() + 1)">
        Copy
      </cngx-context-menu-item>
    </cngx-context-menu>

    <cngx-context-menu ariaLabel="Export as" #sub="cngxContextMenu">
      <ng-template cngxContextMenuContent>
        <cngx-context-menu-item value="pdf">PDF</cngx-context-menu-item>
      </ng-template>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor, CngxContextMenuItem, CngxContextMenuContent],
})
class ActivationHost {
  readonly parentSelects = signal(0);
  readonly leafSelects = signal(0);
}

function rightClick(el: HTMLElement): void {
  el.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 40 }),
  );
}

function key(el: HTMLElement, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

describe('CngxContextMenuItem submenu activation', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ActivationHost>>;
  let host: ActivationHost;
  let parent: CngxContextMenu;
  let sub: CngxContextMenu;

  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [ActivationHost] });
    fixture = TestBed.createComponent(ActivationHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const panels = fixture.debugElement.queryAll(By.directive(CngxContextMenu));
    parent = panels[0].componentInstance as CngxContextMenu;
    sub = panels[1].componentInstance as CngxContextMenu;
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-context-menu-anchor, .cngx-menu-announcer')
      .forEach((el) => el.remove());
  });

  function parentEl(): HTMLElement {
    return fixture.debugElement.queryAll(By.directive(CngxContextMenu))[0].nativeElement;
  }

  function items(): HTMLElement[] {
    return Array.from(parentEl().querySelectorAll('[role="menuitem"]')) as HTMLElement[];
  }

  function itemByText(text: string): HTMLElement {
    const found = items().find((el) => (el.textContent ?? '').includes(text));
    if (!found) {
      throw new Error(`no menuitem containing "${text}"`);
    }
    return found;
  }

  function openParent(): void {
    rightClick(fixture.nativeElement.querySelector('.target'));
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  function settle(): void {
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  it('click on a submenu parent opens the nested panel and emits no leaf select', () => {
    openParent();

    itemByText('Export').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    settle();

    expect(sub.popover.isVisible()).toBe(true);
    expect(parent.popover.isVisible()).toBe(true);
    expect(host.parentSelects()).toBe(0);
  });

  it('Enter on a submenu parent opens the nested panel and emits no leaf select', () => {
    openParent();
    // Open auto-highlights the first item (the Export parent). Enter on the menu
    // container funnels through the container CngxActiveDescendant.
    key(parentEl(), 'Enter');
    settle();

    expect(sub.popover.isVisible()).toBe(true);
    expect(host.parentSelects()).toBe(0);
  });

  it('click on a leaf item still emits select and opens no submenu', () => {
    openParent();

    itemByText('Copy').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    settle();

    expect(host.leafSelects()).toBe(1);
    expect(sub.popover.isVisible()).toBe(false);
  });

  it('Enter on a leaf item still emits select', () => {
    openParent();
    // Move the highlight off the parent onto the Copy leaf, then activate.
    key(parentEl(), 'ArrowDown');
    settle();
    key(parentEl(), 'Enter');
    settle();

    expect(host.leafSelects()).toBe(1);
    expect(sub.popover.isVisible()).toBe(false);
  });

  it('ArrowLeft pops an Enter-opened submenu, proving stack tracking', () => {
    openParent();
    key(parentEl(), 'Enter');
    settle();
    expect(sub.popover.isVisible()).toBe(true);

    key(parentEl(), 'ArrowLeft');
    settle();

    expect(sub.popover.isVisible()).toBe(false);
    expect(parent.popover.isVisible()).toBe(true);
  });
});
