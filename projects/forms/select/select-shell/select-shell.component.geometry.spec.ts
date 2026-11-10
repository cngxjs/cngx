import { Component, signal, viewChild } from '@angular/core';
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

@Component({
  selector: 'cngx-select-shell-many-host',
  standalone: true,
  imports: [CngxSelectShell, CngxSelectOption],
  template: `
    <cngx-select-shell #s [label]="'Item'" [(value)]="value">
      @for (i of items; track i) {
        <cngx-option [value]="i">Option {{ i }}</cngx-option>
      }
    </cngx-select-shell>
  `,
})
class ManyHost {
  readonly items = Array.from({ length: 1000 }, (_, i) => i);
  readonly value = signal<number | undefined>(undefined);
  readonly shell = viewChild.required<CngxSelectShell<number>>('s');
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

// 1000 projected options at the 44px touch floor: off-screen rows skip layout
// and paint (content-visibility) yet stay in the DOM and the a11y tree, and
// scrolling, keyboard reach and the active-row chrome still behave.
describe('CngxSelectShell with 1000 projected options', () => {
  async function mountMany(value?: number) {
    const fixture = TestBed.createComponent(ManyHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    mountedRoot.style.setProperty('--cngx-target-min', '44px');
    document.body.appendChild(mountedRoot);
    if (value !== undefined) {
      fixture.componentInstance.value.set(value);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.shell().open();
    const settle = async (): Promise<void> => {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      await frames(4);
      fixture.detectChanges();
    };
    await settle();
    const root = mountedRoot;
    const scroller = query(root, '.cngx-select__panel');
    const options = () => Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
    return { fixture, settle, scroller, options, root };
  }

  const inView = (scroller: HTMLElement, row: HTMLElement): boolean => {
    const s = scroller.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    return r.height > 0 && r.bottom > s.top && r.top < s.bottom;
  };

  it('keeps all 1000 options in the tree with off-screen ones skipped, not collapsed', async () => {
    const { scroller, options } = await mountMany();
    const all = options();
    expect(all.length).toBe(1000);
    const far = all[900];
    expect(inView(scroller, far)).toBe(false);
    expect(computedValue(far, 'content-visibility')).toBe('auto');
    expect(far.getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('shows the last option after a jump to the end', async () => {
    const { settle, scroller, options } = await mountMany();
    scroller.scrollTop = scroller.scrollHeight;
    await settle();
    scroller.scrollTop = scroller.scrollHeight;
    await settle();
    expect(inView(scroller, options()[999])).toBe(true);
  });

  it('scrolls a far option reached by keyboard into view', async () => {
    const { root, settle, scroller, options } = await mountMany();
    const trigger = query(root, '.cngx-select-shell__trigger');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await settle();
    const last = options()[999];
    expect(root.querySelector('[aria-activedescendant]')?.getAttribute('aria-activedescendant')).toBe(last.id);
    expect(inView(scroller, last)).toBe(true);
  });

  // Paint containment clips at the row box: the active-row tint and every
  // painted part of the row must sit inside it.
  it('paints the highlight and the row chrome inside the active option box', async () => {
    const { settle, scroller, options } = await mountMany(500);
    await settle();
    const active = options()[500];
    expect(active.getAttribute('aria-selected')).toBe('true');
    expect(active.classList).toContain('cngx-option--highlighted');
    expect(inView(scroller, active)).toBe(true);
    expect(computedValue(active, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
    const box = active.getBoundingClientRect();
    for (const part of Array.from(active.querySelectorAll<HTMLElement>('*'))) {
      const r = part.getBoundingClientRect();
      expect(r.left).toBeGreaterThanOrEqual(box.left);
      expect(r.right).toBeLessThanOrEqual(box.right);
      expect(r.top).toBeGreaterThanOrEqual(box.top);
      expect(r.bottom).toBeLessThanOrEqual(box.bottom);
    }
  });
});
