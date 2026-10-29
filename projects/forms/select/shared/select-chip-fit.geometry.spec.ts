import { Component, computed, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxCombobox } from '../combobox/combobox.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import type { CngxSelectOptionDef } from './option.model';
import { CngxComboboxChip, CngxMultiSelectChip, CngxSelectChipOverflow } from './template-slots';

// Runs in a real Chromium (the `test-geometry` target): one-row trigger, the
// slot boxes, `inert` tab order and the focus hand-off are layout and focus
// facts jsdom cannot produce.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'ops', label: 'Operations lead' },
  { value: 'cs', label: 'Customer success' },
  { value: 'fin', label: 'Finance controller' },
  { value: 'plat', label: 'Platform engineer' },
  { value: 'data', label: 'Data steward' },
];
const FOUR = ['ops', 'cs', 'fin', 'plat'];

type Kind = 'multi' | 'combo' | 'multi-projected' | 'combo-projected' | 'combo-wide-badge';

@Component({
  selector: 'cngx-select-chip-fit-geometry-host',
  standalone: true,
  imports: [CngxMultiSelect, CngxCombobox, CngxMultiSelectChip, CngxComboboxChip, CngxSelectChipOverflow],
  template: `
    <button type="button" class="before">before</button>
    <div class="fit-box" [style.width.px]="width()" [attr.dir]="dir()" [style]="boxStyle()">
      @switch (kind()) {
        @case ('multi') {
          <cngx-multi-select
            [label]="'Team'"
            [options]="options"
            [(values)]="values"
            chipOverflow="fit"
            [style]="reserveStyle()"
          />
        }
        @case ('combo') {
          <cngx-combobox
            [label]="'Team'"
            [options]="options"
            [(values)]="values"
            chipOverflow="fit"
            [style]="reserveStyle()"
          />
        }
        @case ('multi-projected') {
          <cngx-multi-select [label]="'Team'" [options]="options" [(values)]="values" chipOverflow="fit">
            <span *cngxMultiSelectChip="let opt; let remove = remove" class="pchip">
              {{ opt.label }}
              <button type="button" class="pchip-x" (click)="remove()">x</button>
            </span>
          </cngx-multi-select>
        }
        @case ('combo-projected') {
          <cngx-combobox [label]="'Team'" [options]="options" [(values)]="values" chipOverflow="fit">
            <span *cngxComboboxChip="let opt; let remove = remove" class="pchip">
              {{ opt.label }}
              <button type="button" class="pchip-x" (click)="remove()">x</button>
            </span>
          </cngx-combobox>
        }
        @case ('combo-wide-badge') {
          <cngx-combobox [label]="'Team'" [options]="options" [(values)]="values" chipOverflow="fit">
            <span *cngxSelectChipOverflow="let count" class="wide-badge" style="display: inline-block; inline-size: 14ch">
              {{ count }} more
            </span>
          </cngx-combobox>
        }
      }
    </div>
    <span class="probe" style="display: inline-block; inline-size: 8ch"></span>
    <button type="button" class="after">after</button>
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly kind = signal<Kind>('multi');
  readonly width = signal(300);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly reserve = signal<string | null>(null);
  readonly boxStyle = signal('');
  readonly values = signal<string[]>([...FOUR]);
  readonly reserveStyle = computed(() => {
    const reserve = this.reserve();
    return reserve ? `--cngx-select-chip-fit-badge-reserve: ${reserve}` : '';
  });
}

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

let fixture: ComponentFixture<Host> | null = null;
let loopErrors: string[] = [];
const onError = (event: ErrorEvent): void => {
  if (/ResizeObserver loop/.test(event.message)) {
    loopErrors.push(event.message);
  }
};

async function settle(f: ComponentFixture<Host>): Promise<void> {
  for (let i = 0; i < 3; i++) {
    f.detectChanges();
    await frame();
  }
  f.detectChanges();
}

async function mount(init: (host: Host) => void): Promise<{ host: Host; root: HTMLElement }> {
  fixture = TestBed.createComponent(Host);
  init(fixture.componentInstance);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  await settle(fixture);
  return { host: fixture.componentInstance, root };
}

function q(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function slots(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-select__chip-slot'));
}

function hiddenSlots(root: HTMLElement): HTMLElement[] {
  return slots(root).filter((slot) => slot.hasAttribute('inert'));
}

function focusTarget(root: HTMLElement, kind: Kind): HTMLElement {
  return kind.startsWith('multi') ? q(root, '.cngx-multi-select__trigger') : q(root, 'input');
}

beforeEach(() => {
  loopErrors = [];
  window.addEventListener('error', onError);
});

afterEach(() => {
  window.removeEventListener('error', onError);
  fixture?.nativeElement.remove();
  fixture = null;
});

for (const kind of ['multi', 'combo'] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    describe(`chipOverflow fit geometry - ${kind}, ${dir}`, () => {
      const init =
        (values: string[] = FOUR) =>
        (h: Host): void => {
          h.kind.set(kind);
          h.dir.set(dir);
          h.values.set(values);
        };

      it('keeps the trigger one chip row tall', async () => {
        const one = await mount(init(['ops']));
        const oneHeight = q(one.root, '.cngx-field-trigger').getBoundingClientRect().height;
        fixture!.nativeElement.remove();
        const four = await mount(init());
        expect(hiddenSlots(four.root).length).toBeGreaterThan(0);
        expect(q(four.root, '.cngx-field-trigger').getBoundingClientRect().height).toBe(oneHeight);
        expect(loopErrors).toEqual([]);
      });

      it('keeps the visible slots and the badge inside the strip', async () => {
        const { root } = await mount(init());
        const strip = q(root, '.cngx-select__chip-list').getBoundingClientRect();
        const boxes = [
          ...slots(root).filter((slot) => !slot.hasAttribute('inert')),
          q(root, '.cngx-select__chip-overflow-slot'),
        ].map((el) => el.getBoundingClientRect());
        for (const box of boxes) {
          expect(box.left).toBeGreaterThanOrEqual(strip.left - 0.5);
          expect(box.right).toBeLessThanOrEqual(strip.right + 0.5);
        }
      });

      it('shows every chip when wide and folds again when narrow', async () => {
        const { host, root } = await mount(init());
        host.width.set(800);
        await settle(fixture!);
        expect(hiddenSlots(root)).toEqual([]);
        expect(root.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
        host.width.set(300);
        await settle(fixture!);
        expect(hiddenSlots(root).length).toBeGreaterThan(0);
        expect(root.querySelector('.cngx-select__chip-overflow-badge')).not.toBeNull();
        expect(loopErrors).toEqual([]);
      });

      it('hands focus from a chip that a narrowing hides to the trigger', async () => {
        const { host, root } = await mount((h) => {
          init()(h);
          h.width.set(800);
        });
        const visible = slots(root);
        const lastRemove = visible[visible.length - 1].querySelector<HTMLElement>('button');
        expect(lastRemove).not.toBeNull();
        lastRemove!.focus();
        expect(document.activeElement).toBe(lastRemove);
        host.width.set(300);
        await settle(fixture!);
        expect(visible[visible.length - 1].hasAttribute('inert')).toBe(true);
        expect(document.activeElement).toBe(focusTarget(root, kind));
      });

      it('shows a consistent badge in the first frame after a selection change', async () => {
        const { host, root } = await mount(init());
        host.values.set([...FOUR, 'data']);
        fixture!.detectChanges();
        await frame();
        const hidden = hiddenSlots(root).length;
        const badge = q(root, '.cngx-select__chip-overflow-badge').textContent?.trim();
        expect(slots(root).length).toBe(5);
        expect(badge).toBe(`+${hidden}`);
        await settle(fixture!);
        expect(hiddenSlots(root).length).toBe(hidden);
      });
    });
  }
}

describe('chipOverflow fit geometry - tab order', () => {
  for (const kind of ['multi', 'combo', 'multi-projected', 'combo-projected'] as const) {
    it(`never tabs into a hidden chip (${kind})`, async () => {
      const { root } = await mount((h) => h.kind.set(kind));
      expect(hiddenSlots(root).length).toBeGreaterThan(0);
      q(root, '.before').focus();
      const reached: Element[] = [];
      for (let i = 0; i < 20 && document.activeElement !== q(root, '.after'); i++) {
        await userEvent.tab();
        if (document.activeElement) {
          reached.push(document.activeElement);
        }
      }
      expect(document.activeElement).toBe(q(root, '.after'));
      for (const slot of hiddenSlots(root)) {
        expect(reached.some((el) => slot.contains(el))).toBe(false);
      }
    });
  }
});

describe('chipOverflow fit geometry - badge reserve', () => {
  it('widens the badge slot from a host value of the reserve token', async () => {
    const plain = await mount((h) => h.kind.set('combo'));
    const plainWidth = q(plain.root, '.cngx-select__chip-overflow-slot').getBoundingClientRect().width;
    fixture!.nativeElement.remove();
    const wide = await mount((h) => {
      h.kind.set('combo');
      h.reserve.set('8ch');
    });
    const probe = q(wide.root, '.probe').getBoundingClientRect().width;
    const wideWidth = q(wide.root, '.cngx-select__chip-overflow-slot').getBoundingClientRect().width;
    expect(wideWidth).toBeGreaterThan(plainWidth);
    expect(wideWidth).toBeGreaterThanOrEqual(probe - 0.5);
    expect(loopErrors).toEqual([]);
  });
});

describe('chipOverflow fit geometry - input min-width override', () => {
  for (const kind of ['combo', 'combo-wide-badge'] as const) {
    it(`keeps one count per width when the input may shrink (${kind})`, async () => {
      const { host, root } = await mount((h) => {
        h.kind.set(kind);
        h.boxStyle.set(
          '--cngx-combobox-input-min-width: 0px; --cngx-action-multi-select-input-min-width: 0px',
        );
      });
      const unstable: number[] = [];
      for (let width = 220; width <= 900; width += 2) {
        host.width.set(width);
        await settle(fixture!);
        const counts = new Set<number>();
        for (let i = 0; i < 4; i++) {
          await frame();
          fixture!.detectChanges();
          counts.add(hiddenSlots(root).length);
        }
        if (counts.size > 1) {
          unstable.push(width);
        }
      }
      expect(unstable).toEqual([]);
      expect(loopErrors).toEqual([]);
      host.width.set(300);
      await settle(fixture!);
      const reserve = q(root, '.cngx-select__chip-overflow-slot').getBoundingClientRect().width;
      host.values.set(['ops']);
      await settle(fixture!);
      expect(q(root, '.cngx-select__chip-overflow-slot').getBoundingClientRect().width).toBe(reserve);
    }, 180_000);
  }
});

// The paint box of an outline is its border box grown by width + offset. An
// ancestor with `overflow: clip` clips at its border box grown by
// `overflow-clip-margin`, `hidden` clips at the border box itself.
function ringClippedBy(el: HTMLElement): HTMLElement | null {
  const cs = getComputedStyle(el);
  const bleed = parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset);
  const box = el.getBoundingClientRect();
  for (let node = el.parentElement; node && !node.classList.contains('cngx-field-trigger'); node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.overflowX === 'visible' && style.overflowY === 'visible') {
      continue;
    }
    const margin = style.overflowX === 'clip' ? parseFloat(style.overflowClipMargin) || 0 : 0;
    const clip = node.getBoundingClientRect();
    const inside =
      box.left - bleed >= clip.left - margin - 0.5 &&
      box.right + bleed <= clip.right + margin + 0.5 &&
      box.top - bleed >= clip.top - margin - 0.5 &&
      box.bottom + bleed <= clip.bottom + margin + 0.5;
    if (!inside) {
      return node;
    }
  }
  return null;
}

describe('chipOverflow fit geometry - focus ring', () => {
  for (const kind of ['multi', 'combo'] as const) {
    it(`keeps the remove button ring of a capped chip unclipped (${kind})`, async () => {
      const { root } = await mount((h) => {
        h.kind.set(kind);
        h.values.set(['fin', 'ops']);
        h.width.set(220);
      });
      const remove = q(root, '.cngx-select__chip-slot:not([inert]) .cngx-chip__remove');
      q(root, '.before').focus();
      for (let i = 0; i < 10 && document.activeElement !== remove; i++) {
        await userEvent.tab();
      }
      expect(remove.matches(':focus-visible')).toBe(true);
      expect(ringClippedBy(remove)?.className ?? null).toBeNull();
    });
  }
});
