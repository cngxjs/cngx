import { Component, signal, ViewEncapsulation } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMultiSelect } from '../multi-select/multi-select.component';

// Runs in a real Chromium (the `test-geometry` target). Under the touch floor
// (`data-touch="on"`, the same 44px a coarse pointer sets) the multi-value
// triggers swap their chips for a one-line summary: the first label plus a
// `+N` badge. The row keeps the 44px family height and its width at every
// selection count, and a long first label is cut, not wrapped.

const LONG_LABEL = 'L'.repeat(200);

function optionsWith(firstLabel: string): { value: string; label: string }[] {
  return Array.from({ length: 50 }, (_, i) => ({
    value: `v${i}`,
    label: i === 0 ? firstLabel : `Option ${i}`,
  }));
}

@Component({
  selector: 'cngx-select-summary-trigger-host',
  standalone: true,
  imports: [CngxMultiSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-touch="on" style="display: block; width: 20rem; margin: 1rem">
      <cngx-multi-select [label]="'C'" [options]="options()" [values]="values()" />
    </div>
  `,
})
class SummaryTriggerHost {
  readonly options = signal(optionsWith('Red'));
  readonly values = signal<string[]>([]);
}

/** Every summary variant: its host tag. */
const VARIANTS = ['cngx-multi-select'] as const;

let mountedRoot: HTMLElement | null = null;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(fixture: ComponentFixture<SummaryTriggerHost>): Promise<void> {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    TestBed.flushEffects();
    await nextFrame();
  }
  fixture.detectChanges();
}

async function mount(): Promise<ComponentFixture<SummaryTriggerHost>> {
  const fixture = TestBed.createComponent(SummaryTriggerHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  await settle(fixture);
  return fixture;
}

async function select(fixture: ComponentFixture<SummaryTriggerHost>, count: number): Promise<void> {
  fixture.componentInstance.values.set(
    fixture.componentInstance
      .options()
      .slice(0, count)
      .map((o) => o.value),
  );
  await settle(fixture);
}

function trigger(tag: string): HTMLElement {
  return mountedRoot!.querySelector<HTMLElement>(`${tag} .cngx-field-trigger`)!;
}

function box(tag: string): { width: number; height: number } {
  const rect = trigger(tag).getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select summary trigger under the touch floor', () => {
  for (const tag of VARIANTS) {
    it(`${tag} keeps one 44px box at 0, 1, 5 and 50 values`, async () => {
      const fixture = await mount();
      const empty = box(tag);
      expect(empty.height).toBe(44);
      for (const count of [1, 5, 50]) {
        await select(fixture, count);
        expect(trigger(tag).querySelectorAll('cngx-chip')).toHaveLength(0);
        expect(trigger(tag).querySelector('cngx-select-summary'), `${count}`).not.toBeNull();
        expect(box(tag), `${tag} at ${count} values`).toEqual(empty);
      }
    });

    it(`${tag} cuts a 200-character first label at 44px and keeps the badge inside the row`, async () => {
      const fixture = await mount();
      fixture.componentInstance.options.set(optionsWith(LONG_LABEL));
      await select(fixture, 5);
      // A content-sized trigger grows up to its container, never past it, and
      // never by a line.
      const wrapper = mountedRoot!.querySelector<HTMLElement>('[data-touch]')!;
      expect(box(tag).height).toBe(44);
      expect(box(tag).width).toBeLessThanOrEqual(Math.round(wrapper.getBoundingClientRect().width));

      const row = trigger(tag).getBoundingClientRect();
      const label = trigger(tag).querySelector<HTMLElement>('.cngx-select-summary__label')!;
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      const badge = trigger(tag)
        .querySelector<HTMLElement>('.cngx-select__chip-overflow-badge')!
        .getBoundingClientRect();
      expect(badge.left).toBeGreaterThanOrEqual(row.left);
      expect(badge.right).toBeLessThanOrEqual(row.right);
      expect(badge.top).toBeGreaterThanOrEqual(row.top);
      expect(badge.bottom).toBeLessThanOrEqual(row.bottom);
    });
  }
});
