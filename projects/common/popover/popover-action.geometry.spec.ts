import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopoverAction } from './popover-action.component';
import { CngxPopoverPanel } from './popover-panel.component';
import { CngxPopoverBody, CngxPopoverFooter, CngxPopoverHeader } from './popover-panel-slots';

// Runs in a real Chromium (the `test-geometry` target). One geometry spec in
// the popover folder guards the footer action and the panel:
//
//   1. `button[cngxPopoverAction]` - painted by button.component.css at the
//      pinned `data-size="sm"`: a centred inline-flex row whose inline padding
//      is SET from `--cngx-space-sm`, floored to `--cngx-target-min`.
//   2. `.cngx-popover-panel` (popover-panel.component.css:344) - the panel is
//      a fixed floater; its footer is a right-aligned flex action row and its
//      header-row is a centred flex row.
//
// jsdom reports `''` for every read. (The panel reads hold even if the
// unopened floater resolves to display:none, since `display` / `position` /
// `justify-content` do not depend on ancestor layout.)

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxPopoverAction],
  template: `<button cngxPopoverAction="solid" tone="primary" [action]="save">OK</button>`,
})
class ActionHost {
  readonly save = (): Promise<void> => Promise.resolve();
}

@Component({
  standalone: true,
  imports: [CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter],
  template: `
    <cngx-popover-panel>
      <span cngxPopoverHeader>Title</span>
      <p cngxPopoverBody>Body</p>
      <div cngxPopoverFooter>Footer</div>
    </cngx-popover-panel>
  `,
})
class PanelHost {}

function mount<T>(type: new () => T, selector: string): HTMLElement {
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector(selector);
  if (!host) {
    throw new Error(`${selector} did not render`);
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
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

describe('CngxPopoverAction geometry', () => {
  it('is a centred inline-flex action row with scale-derived padding', () => {
    const button = mount(ActionHost, 'button.cngx-popover-action');
    expect(button.getAttribute('data-size')).toBe('sm');
    expect(computedValue(button, 'display')).toBe('inline-flex');
    expect(computedValue(button, 'align-items')).toBe('center');
    // The sm row SETs the inline padding from var(--cngx-space-sm).
    button.style.setProperty('--cngx-space-sm', '20px');
    expect(computedValue(button, 'padding-left')).toBe('20px');
  });

  it('floors the action-row height to the pointer-derived target', () => {
    const button = mount(ActionHost, 'button.cngx-popover-action');
    button.style.setProperty('--cngx-target-min', '40px');
    expect(computedValue(button, 'min-block-size')).toBe('40px');
  });
});

describe('CngxPopoverPanel geometry', () => {
  it('is a fixed floater', () => {
    const panel = mount(PanelHost, '.cngx-popover-panel');
    expect(computedValue(panel, 'position')).toBe('fixed');
  });

  it('right-aligns the footer action row', () => {
    const panel = mount(PanelHost, '.cngx-popover-panel');
    const footer = query(panel, '.cngx-popover-panel__footer');
    expect(computedValue(footer, 'display')).toBe('flex');
    expect(computedValue(footer, 'justify-content')).toBe('flex-end');
  });

  it('lays the header row as a centred flex row', () => {
    const panel = mount(PanelHost, '.cngx-popover-panel');
    const headerRow = query(panel, '.cngx-popover-panel__header-row');
    expect(computedValue(headerRow, 'display')).toBe('flex');
    expect(computedValue(headerRow, 'align-items')).toBe('center');
  });
});
