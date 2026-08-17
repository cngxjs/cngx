import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuContent } from './context-menu-content.directive';
import { CngxContextMenuFor } from './context-menu-for.directive';
import { CngxContextMenuItem } from './context-menu-item.component';
import { CNGX_MENU_GLYPHS } from './menu-glyphs';

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
    <div class="target" tabindex="0" [cngxContextMenuFor]="parent" [cngxContextMenuData]="row()">
      Right-click
    </div>

    <cngx-context-menu ariaLabel="Row actions" #parent="cngxContextMenu">
      <cngx-context-menu-item value="export" [submenu]="sub">Export</cngx-context-menu-item>
    </cngx-context-menu>

    <cngx-context-menu ariaLabel="Export as" #sub="cngxContextMenu">
      <ng-template cngxContextMenuContent>
        <cngx-context-menu-item value="pdf">PDF</cngx-context-menu-item>
      </ng-template>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor, CngxContextMenuItem, CngxContextMenuContent],
})
class SubmenuHost {
  readonly row = signal<Row>({ id: 1, name: 'Alpha' });
}

function rightClick(el: HTMLElement): void {
  el.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 40 }),
  );
}

function arrow(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('CngxContextMenuItem submenu wiring', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SubmenuHost>>;
  let parent: CngxContextMenu<Row>;
  let sub: CngxContextMenu<Row>;

  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SubmenuHost] });
    fixture = TestBed.createComponent(SubmenuHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const panels = fixture.debugElement.queryAll(By.directive(CngxContextMenu));
    parent = panels[0].componentInstance as CngxContextMenu<Row>;
    sub = panels[1].componentInstance as CngxContextMenu<Row>;
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-context-menu-anchor, .cngx-menu-announcer')
      .forEach((el) => el.remove());
  });

  function parentEl(): HTMLElement {
    return fixture.debugElement.queryAll(By.directive(CngxContextMenu))[0].nativeElement;
  }

  function openParent(): void {
    rightClick(fixture.nativeElement.querySelector('.target'));
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  it('marks the submenu item with aria-haspopup and a caret', () => {
    const item = fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLElement;
    expect(item.getAttribute('aria-haspopup')).toBe('menu');
    expect(item.textContent).toContain(CNGX_MENU_GLYPHS.submenuCaret);
  });

  it('ArrowRight opens the nested panel non-exclusively and mirrors the parent row context', () => {
    openParent();
    expect(parent.popover.isVisible()).toBe(true);
    expect(parent.context()).toEqual({ id: 1, name: 'Alpha' });

    arrow(parentEl(), 'ArrowRight');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(sub.popover.isVisible()).toBe(true);
    expect(parent.popover.isVisible()).toBe(true);
    expect(sub.context()).toEqual({ id: 1, name: 'Alpha' });
  });

  it('ArrowLeft closes the nested panel and leaves the parent open', () => {
    openParent();
    arrow(parentEl(), 'ArrowRight');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(sub.popover.isVisible()).toBe(true);

    arrow(parentEl(), 'ArrowLeft');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(sub.popover.isVisible()).toBe(false);
    expect(parent.popover.isVisible()).toBe(true);
  });
});
