import { Component, signal, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxScrollEdges } from './scroll-edges.directive';

// Runs in a real Chromium (the `test-geometry` target): real scroll metrics,
// real negative `scrollLeft` under `dir="rtl"`, real scroll / resize events.

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
    >
      <div class="edges-content"></div>
    </div>
  `,
})
class GeometryHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly tight = signal(false);
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

  async function mount(dir: 'ltr' | 'rtl', tight = false) {
    fixture = TestBed.createComponent(GeometryHost);
    fixture.componentInstance.dir.set(dir);
    fixture.componentInstance.tight.set(tight);
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

  it('reports no edge for a 1px overflow', async () => {
    const { box, edges } = await mount('ltr', true);
    expect(box.scrollHeight - box.clientHeight).toBe(1);
    expect(await edges()).toEqual([]);
  });
});
