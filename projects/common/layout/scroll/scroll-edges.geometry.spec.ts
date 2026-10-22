import { Component, signal, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxScrollEdges } from './scroll-edges.directive';

// Runs in a real Chromium (the `test-geometry` target): real scroll metrics,
// real negative `scrollLeft` under `dir="rtl"`, real scroll / resize events.

type WritingMode = 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' | 'sideways-lr';

const EDGE_ATTRIBUTES = [
  'data-scroll-block-start',
  'data-scroll-block-end',
  'data-scroll-inline-start',
  'data-scroll-inline-end',
] as const;

@Component({
  selector: 'cngx-scroll-edges-geometry-host',
  standalone: true,
  imports: [CngxScrollEdges],
  encapsulation: ViewEncapsulation.None,
  styles: `
    .edges-box {
      inline-size: 200px;
      block-size: 100px;
      overflow: auto;
      scrollbar-width: none;
      border: 0;
      padding: 0;
    }
    .edges-content {
      inline-size: 600px;
      block-size: 400px;
    }
    .edges-box--tight {
      overflow-x: hidden;
    }
    .edges-box--tight .edges-content {
      inline-size: 100%;
      block-size: 101px;
    }
  `,
  template: `
    <div
      cngxScrollEdges
      class="edges-box"
      [class.edges-box--tight]="tight()"
      [attr.dir]="dir()"
      [style.writing-mode]="writingMode()"
    >
      <div class="edges-content"></div>
    </div>
  `,
})
class GeometryHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly tight = signal(false);
  readonly writingMode = signal<WritingMode>('horizontal-tb');
}

/** Enough frames for the scroll / resize event, the coalesced read and a spare. */
async function frames(count = 3): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

describe('CngxScrollEdges geometry', () => {
  let fixture: ComponentFixture<GeometryHost> | null = null;

  afterEach(() => {
    fixture?.destroy();
    fixture = null;
  });

  async function mount(
    dir: 'ltr' | 'rtl',
    tight = false,
    writingMode: WritingMode = 'horizontal-tb',
  ) {
    fixture = TestBed.createComponent(GeometryHost);
    fixture.componentInstance.dir.set(dir);
    fixture.componentInstance.tight.set(tight);
    fixture.componentInstance.writingMode.set(writingMode);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    await frames();
    const current = fixture;
    const box = current.nativeElement.querySelector('.edges-box') as HTMLElement;
    const edges = async () => {
      await frames();
      current.detectChanges();
      return EDGE_ATTRIBUTES.filter((name) => box.hasAttribute(name));
    };
    const scrollTo = async (left: number, top: number) => {
      box.scrollTo({ left, top, behavior: 'instant' });
      return edges();
    };
    return { box, edges, scrollTo };
  }

  it('reports each edge in LTR', async () => {
    const { box, edges, scrollTo } = await mount('ltr');
    const maxLeft = box.scrollWidth - box.clientWidth;
    const maxTop = box.scrollHeight - box.clientHeight;
    expect(maxLeft).toBe(400);
    expect(maxTop).toBe(300);

    expect(await edges()).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
    expect(await scrollTo(maxLeft / 2, maxTop / 2)).toEqual([...EDGE_ATTRIBUTES]);
    expect(await scrollTo(maxLeft, maxTop)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-start',
    ]);
    expect(await scrollTo(0, 0)).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
  });

  it('keeps start / end semantics under dir="rtl" with a negative scrollLeft', async () => {
    const { box, edges, scrollTo } = await mount('rtl');
    const maxLeft = box.scrollWidth - box.clientWidth;
    const maxTop = box.scrollHeight - box.clientHeight;

    expect(await edges()).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);

    expect(await scrollTo(-maxLeft / 2, maxTop / 2)).toEqual([...EDGE_ATTRIBUTES]);

    expect(await scrollTo(-maxLeft, maxTop)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-start',
    ]);
    // The engine really reports the RTL offset as negative.
    expect(box.scrollLeft).toBe(-maxLeft);

    expect(await scrollTo(0, 0)).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
  });

  it('clears every edge when the content shrinks to fit', async () => {
    const { box, edges, scrollTo } = await mount('ltr');
    expect(await scrollTo(200, 150)).toEqual([...EDGE_ATTRIBUTES]);

    const content = box.querySelector('.edges-content') as HTMLElement;
    content.style.inlineSize = '200px';
    content.style.blockSize = '100px';

    expect(await edges()).toEqual([]);
  });

  it('observes a child appended after mount and reacts to its growth', async () => {
    const { box, edges } = await mount('ltr');
    const content = box.querySelector('.edges-content') as HTMLElement;
    content.style.inlineSize = '200px';
    content.style.blockSize = '100px';
    expect(await edges()).toEqual([]);

    const late = document.createElement('div');
    late.style.blockSize = '0px';
    box.appendChild(late);
    expect(await edges()).toEqual([]);

    // Only the late child resizes: the box and the first child keep their size.
    late.style.blockSize = '300px';
    expect(await edges()).toEqual(['data-scroll-block-end']);
  });

  it('reports no edge for a 1px overflow', async () => {
    const { box, edges } = await mount('ltr', true);
    expect(box.scrollHeight - box.clientHeight).toBe(1);
    expect(await edges()).toEqual([]);
  });

  // The box is 200px inline by 100px block, so in a vertical writing mode it is
  // 100px wide and 200px tall; the 600 x 400 content overflows 300px on the
  // horizontal block axis and 400px on the vertical inline axis.
  it('maps the block axis to scrollLeft under writing-mode: vertical-rl', async () => {
    const { box, edges, scrollTo } = await mount('ltr', false, 'vertical-rl');
    const maxLeft = box.scrollWidth - box.clientWidth;
    const maxTop = box.scrollHeight - box.clientHeight;
    expect(maxLeft).toBe(300);
    expect(maxTop).toBe(400);

    expect(await edges()).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);

    // Block-end is the left edge: scrolling there drives scrollLeft negative.
    expect(await scrollTo(-maxLeft, 0)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-end',
    ]);
    expect(box.scrollLeft).toBe(-maxLeft);

    expect(await scrollTo(-maxLeft, maxTop)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-start',
    ]);
    expect(await scrollTo(0, 0)).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
  });

  it('maps the block axis to a positive scrollLeft under writing-mode: vertical-lr', async () => {
    const { box, edges, scrollTo } = await mount('ltr', false, 'vertical-lr');
    const maxLeft = box.scrollWidth - box.clientWidth;
    const maxTop = box.scrollHeight - box.clientHeight;
    expect(maxLeft).toBe(300);
    expect(maxTop).toBe(400);

    expect(await edges()).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
    // One axis only: block-end is the right edge, so scrollLeft alone moves the block axis.
    expect(await scrollTo(maxLeft, 0)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-end',
    ]);
    expect(box.scrollLeft).toBe(maxLeft);
    expect(await scrollTo(maxLeft / 2, maxTop / 2)).toEqual([...EDGE_ATTRIBUTES]);
    expect(await scrollTo(maxLeft, maxTop)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-start',
    ]);
  });

  it('reads a negative scrollTop as the inline offset under writing-mode: sideways-lr', async () => {
    const { box, edges, scrollTo } = await mount('ltr', false, 'sideways-lr');
    const maxLeft = box.scrollWidth - box.clientWidth;
    const maxTop = box.scrollHeight - box.clientHeight;
    expect(maxLeft).toBe(300);
    expect(maxTop).toBe(400);

    expect(await edges()).toEqual(['data-scroll-block-end', 'data-scroll-inline-end']);
    // Inline-start is the bottom edge: scrolling toward inline-end drives scrollTop negative.
    expect(await scrollTo(0, -maxTop)).toEqual([
      'data-scroll-block-end',
      'data-scroll-inline-start',
    ]);
    expect(box.scrollTop).toBe(-maxTop);
    expect(await scrollTo(maxLeft, -maxTop)).toEqual([
      'data-scroll-block-start',
      'data-scroll-inline-start',
    ]);
  });
});
