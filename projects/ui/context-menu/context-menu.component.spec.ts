import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuContent } from './context-menu-content.directive';
import type { CngxContextMenuPanel } from './context-menu-panel';

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
    <cngx-context-menu ariaLabel="Row actions" #menu="cngxContextMenu">
      <ng-template cngxContextMenuContent let-row>
        <span class="row-label">{{ $any(row)?.name ?? 'closed' }}</span>
      </ng-template>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuContent],
})
class TemplateHost {
  readonly row = signal<Row>({ id: 1, name: 'Alpha' });
}

@Component({
  template: `
    <cngx-context-menu ariaLabel="Static" #menu="cngxContextMenu">
      <button class="static-item" type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu],
})
class StaticHost {}

describe('CngxContextMenu', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  function setupTemplate() {
    TestBed.configureTestingModule({ imports: [TemplateHost] });
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
      .componentInstance as CngxContextMenu<Row>;
    return { fixture, panel };
  }

  it('exposes the popover and menu brains as host-scoped instances', () => {
    const { panel } = setupTemplate();
    expect(panel.popover).toBeTruthy();
    expect(panel.menuHost).toBeTruthy();
  });

  it('satisfies the CngxContextMenuPanel seam the trigger depends on', () => {
    const { panel } = setupTemplate();
    // Assigns through the interface: the trigger consumes this shape, not the
    // concrete class, so an ejected panel skin can satisfy the same seam.
    const seam: CngxContextMenuPanel<Row> = panel;
    expect(seam.popover.isVisible()).toBe(false);
    expect(seam.menuHost.ad).toBeTruthy();
    expect(typeof seam.setContext).toBe('function');
    expect(seam.context()).toBeNull();
  });

  it('carries role=menu and the forwarded accessible name', () => {
    const { fixture } = setupTemplate();
    const host = fixture.debugElement.query(By.directive(CngxContextMenu)).nativeElement as HTMLElement;
    expect(host.getAttribute('role')).toBe('menu');
    expect(host.getAttribute('aria-label')).toBe('Row actions');
  });

  it('sets context on open and nulls it on every dismiss without manual sync', () => {
    const { fixture, panel } = setupTemplate();
    const row: Row = { id: 7, name: 'Bravo' };

    panel.setContext(row);
    panel.popover.show();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(panel.context()).toBe(row);

    panel.popover.hide();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(panel.context()).toBeNull();
  });

  it('openAsSubmenu installs the inline-end placement policy and mirrors the datum', () => {
    const { fixture, panel } = setupTemplate();
    const row: Row = { id: 9, name: 'Delta' };

    // The panel owns the submenu-open policy so a projected item drives one
    // seam instead of reaching into the popover override signals.
    panel.openAsSubmenu(row);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(panel.popover.placementOverride()).toBe('right-start');
    expect(panel.popover.positionTryFallbacksOverride()).toEqual([...CNGX_SUBMENU_TRY_FALLBACKS]);
    expect(panel.popover.exclusiveOverride()).toBe(false);
    expect(panel.popover.isVisible()).toBe(true);
    expect(panel.context()).toBe(row);
  });

  it('instantiates the lazy content template only while open', () => {
    const { fixture, panel } = setupTemplate();
    const label = (): HTMLElement | null =>
      fixture.nativeElement.querySelector('.row-label');

    expect(label()).toBeNull();

    panel.setContext({ id: 2, name: 'Charlie' });
    panel.popover.show();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(label()?.textContent?.trim()).toBe('Charlie');

    panel.popover.hide();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(label()).toBeNull();
  });

  it('projects static content when no content template is present', () => {
    TestBed.configureTestingModule({ imports: [StaticHost] });
    const fixture = TestBed.createComponent(StaticHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const item = fixture.nativeElement.querySelector('.static-item') as HTMLElement;
    expect(item.textContent?.trim()).toBe('Copy');
  });
});
