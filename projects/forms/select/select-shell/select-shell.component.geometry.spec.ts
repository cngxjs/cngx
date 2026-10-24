import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSelectShell } from './select-shell.component';
import { CngxSelectOption } from '../declarative/option.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-select-shell)` root is the positioned anchor the projected-option
// panel resolves against, and the trigger is a flex row keeping the caret
// intrinsic beside the label. jsdom reports `''` for these reads.

@Component({
  selector: 'cngx-select-shell-geometry-host',
  standalone: true,
  imports: [CngxSelectShell, CngxSelectOption],
  template: `
    <cngx-select-shell [label]="'Colour'" [(value)]="value">
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'green'">Green</cngx-option>
    </cngx-select-shell>
  `,
})
class ShellHost {
  readonly value = signal<string | undefined>(undefined);
}

@Component({
  selector: 'cngx-select-shell-live-label-host',
  standalone: true,
  imports: [CngxSelectShell, CngxSelectOption],
  template: `
    <cngx-select-shell [label]="'Fruit'" [(value)]="value">
      <cngx-option [value]="'a'">{{ label() }}</cngx-option>
      <cngx-option [value]="'b'">Banana</cngx-option>
    </cngx-select-shell>
  `,
})
class LiveLabelHost {
  readonly value = signal<string | undefined>('a');
  readonly label = signal('Apple');
}

let mountedRoot: HTMLElement | null = null;

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ShellHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-select-shell');
  if (!host) {
    throw new Error('cngx-select-shell did not render');
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

describe('CngxSelectShell geometry', () => {
  it('anchors the panel on a positioned scope root', () => {
    expect(computedValue(mount(), 'position')).toBe('relative');
  });

  it('lays the trigger out as a flex row with the caret pinned intrinsic', () => {
    const host = mount();
    expect(computedValue(query(host, '.cngx-select-shell__trigger'), 'display')).toMatch(/flex$/);
    expect(computedValue(query(host, '.cngx-select-shell__caret'), 'flex-grow')).toBe('0');
  });

  it('echoes the current projected option text on the trigger after it changes', async () => {
    const fixture = TestBed.createComponent(LiveLabelHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    await fixture.whenStable();
    await frames(2);
    fixture.detectChanges();
    const label = query(mountedRoot, '.cngx-select-shell__label');
    expect(label.textContent?.trim()).toBe('Apple');

    fixture.componentInstance.label.set('Cherry');
    fixture.detectChanges();
    await frames(2);
    fixture.detectChanges();
    expect(label.textContent?.trim()).toBe('Cherry');
  });

  it('starts the value at the shared md inline padding of the field box', () => {
    const host = mount();
    // No system tokens in this harness: pin the two scale rungs the trigger
    // padding SETs from, so the assertion reads the rung, not a fallback.
    host.style.setProperty('--cngx-space-sm', '8px');
    host.style.setProperty('--cngx-space-md', '16px');
    const trigger = query(host, '.cngx-field-trigger');
    expect(computedValue(trigger, 'padding-inline-start')).toBe('16px');
    expect(computedValue(trigger, 'padding-inline-end')).toBe('16px');
  });
});
