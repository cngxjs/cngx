import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideDirection } from '@cngx/core';
import { afterEach, describe, expect, it } from 'vitest';

import { CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuFor } from './context-menu-for.directive';
import { CngxContextMenuItem } from './context-menu-item.component';

// Runs in a real Chromium (`test-geometry`). Shaped like the
// `nested-export-menu` story: the submenu opens through openAsSubmenu and the
// rects are read in the same turn, with no change detection in between, so
// the assertions see the first painted frame. The submenu panel projects its
// items directly; a content template would render them only after change
// detection.
//
// Side checks compare edges, never centres: the stale frame is
// `bottom span-all`, centred under the item.

@Component({
  selector: 'cngx-context-submenu-placement-host',
  standalone: true,
  imports: [CngxContextMenu, CngxContextMenuFor, CngxContextMenuItem],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-popover.css',
    '../../common/theming/components/cngx-menu.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="zone"
      tabindex="0"
      [cngxContextMenuFor]="menu"
      style="position: fixed; inset: 0"
    ></div>

    <cngx-context-menu ariaLabel="Document actions" #menu="cngxContextMenu">
      <cngx-context-menu-item value="rename">Rename</cngx-context-menu-item>
      <cngx-context-menu-item class="item-sub" [submenu]="exportMenu"
        >Export as</cngx-context-menu-item
      >
    </cngx-context-menu>

    <cngx-context-menu ariaLabel="Export format" #exportMenu="cngxContextMenu">
      <cngx-context-menu-item value="pdf">PDF</cngx-context-menu-item>
      <cngx-context-menu-item value="csv">CSV</cngx-context-menu-item>
    </cngx-context-menu>
  `,
})
class SubmenuPlacementHost {}

// `POSITION_AREA` (`@cngx/common/popover/anchor-positioning.ts`) is internal to
// the popover entry point; these are its `right-start` / `left-start` entries.
// Chromium names the property `position-area`.
const AREA_PROPERTY = 'position-area';
const RIGHT_START = 'right span-bottom';
const LEFT_START = 'left span-bottom';

// Chromium serializes some area values shorter than the table entry; compare
// against the same round trip.
function serializedArea(value: string): string {
  const probe = document.createElement('div');
  probe.style.setProperty(AREA_PROPERTY, value);
  return probe.style.getPropertyValue(AREA_PROPERTY);
}

let panels: CngxContextMenu[] = [];

function openRootThenSubmenu() {
  const fixture = TestBed.createComponent(SubmenuPlacementHost);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  fixture.detectChanges();
  TestBed.flushEffects();

  panels = fixture.debugElement
    .queryAll(By.directive(CngxContextMenu))
    .map((d) => d.componentInstance as CngxContextMenu);
  const [menu, exportMenu] = panels;

  (root.querySelector('.zone') as HTMLElement).dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: Math.round(window.innerWidth / 2),
      clientY: 120,
    }),
  );
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  expect(menu.popover.isVisible()).toBe(true);

  exportMenu.openAsSubmenu(null, menu);

  const panel = exportMenu.popover.elementRef.nativeElement;
  return {
    panel,
    area: panel.style.getPropertyValue(AREA_PROPERTY),
    tryFallbacks: panel.style.getPropertyValue('position-try-fallbacks'),
    item: (root.querySelector('.item-sub') as HTMLElement).getBoundingClientRect(),
    submenu: panel.getBoundingClientRect(),
  };
}

describe('context-menu submenu placement on the first open frame (geometry)', () => {
  afterEach(() => {
    for (const panel of [...panels].reverse()) {
      panel.popover.hide();
    }
    panels = [];
    document.documentElement.removeAttribute('dir');
    document.body.replaceChildren();
  });

  it('flanks the item on the right under ltr', () => {
    const { area, tryFallbacks, item, submenu } = openRootThenSubmenu();

    expect(area).toBe(serializedArea(RIGHT_START));
    expect(tryFallbacks).toBe(CNGX_SUBMENU_TRY_FALLBACKS.join(', '));
    expect(submenu.left).toBeGreaterThanOrEqual(item.right - 1);
  });

  it('flanks the item on the left under rtl', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const { area, item, submenu } = openRootThenSubmenu();

    expect(area).toBe(serializedArea(LEFT_START));
    expect(submenu.right).toBeLessThanOrEqual(item.left + 1);
  });
});
