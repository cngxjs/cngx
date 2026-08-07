import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopoverAction } from './popover-action.component';
import { CngxPopoverPanel } from './popover-panel.component';
import { CngxPopoverBody, CngxPopoverFooter, CngxPopoverHeader } from './popover-panel-slots';

// Runs in a real Chromium (the `test-geometry` target). One geometry spec in
// the popover folder guards both co-located `@scope` stylesheets:
//
//   1. `.cngx-popover-action` (popover-action.component.css:158) - the action
//      button is a centred inline-flex row, derives padding from the
//      `--cngx-space-*` scale, and floors its block axis to `--cngx-target-min`.
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
  // role="dismiss" renders a plain button - no async action wiring needed.
  template: `<cngx-popover-action [role]="'dismiss'" [variant]="'primary'">OK</cngx-popover-action>`,
})
class ActionHost {}

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
    const button = mount(ActionHost, '.cngx-popover-action');
    expect(computedValue(button, 'display')).toBe('inline-flex');
    expect(computedValue(button, 'align-items')).toBe('center');
    // :scope SETs the inline padding from var(--cngx-space-md).
    button.style.setProperty('--cngx-space-md', '20px');
    expect(computedValue(button, 'padding-left')).toBe('20px');
  });

  it('floors the action-row height to the pointer-derived target', () => {
    const button = mount(ActionHost, '.cngx-popover-action');
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
