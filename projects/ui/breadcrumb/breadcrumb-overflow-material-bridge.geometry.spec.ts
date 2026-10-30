import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The Material menu
// bridge sizes a bare [cngxMenu] like mat-menu (280px cap, label-large rows).
// The overflow menu sits in a CngxPopoverPanel and sizes its own rows, which
// never wrap, so the bridge must leave its metrics alone: a long collapsed
// crumb stays inside the list. The panel markup is static (the classes and
// attributes the component renders) so the spec reads only the stylesheets.

const LONG = 'Department of Infrastructure and Urban Development, Transport Planning Unit';

@Component({
  selector: 'cngx-breadcrumb-overflow-material-bridge-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/density-tokens.css',
    '../../common/theming/components/cngx-menu.css',
    './breadcrumb-overflow.component.css',
    './breadcrumb-overflow-material-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cngx-popover-panel cngx-popover-panel--default" role="group" style="display: inline-block">
      <ul cngxMenu role="menu" class="cngx-breadcrumb__overflow-menu organism">
        <li cngxMenuItem role="menuitem" class="cngx-breadcrumb__overflow-item long">{{ long }}</li>
      </ul>
    </div>
    <ul cngxMenu role="menu" class="bare" style="inline-size: max-content">
      <li cngxMenuItem role="menuitem" class="bare-item">PDF</li>
    </ul>
  `,
})
class OverflowBridgeHost {
  readonly long = LONG;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OverflowBridgeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('breadcrumb overflow under the Material menu bridge', () => {
  it('keeps a long collapsed crumb inside the list (no bridged width cap)', () => {
    const root = mount();
    const menu = query(root, '.organism').getBoundingClientRect();
    const row = query(root, '.long');
    expect(menu.width).toBeGreaterThan(280);
    expect(row.getBoundingClientRect().right).toBeLessThanOrEqual(menu.right + 0.5);
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  });

  it('keeps the overflow rows on their own type, not the bridged label-large', () => {
    const root = mount();
    const row = getComputedStyle(query(root, '.long'));
    const bare = getComputedStyle(query(root, '.bare-item'));
    expect(bare.fontSize).toBe('14px');
    expect(row.fontWeight).not.toBe(bare.fontWeight);
  });

  it('still bridges a menu outside a popover panel', () => {
    const root = mount();
    const bare = getComputedStyle(query(root, '.bare'));
    expect(parseFloat(bare.maxInlineSize)).toBe(280);
    expect(query(root, '.bare-item').getBoundingClientRect().height).toBe(48);
  });
});
