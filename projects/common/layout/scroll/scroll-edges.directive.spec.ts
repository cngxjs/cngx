import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxScrollEdges } from './scroll-edges.directive';

interface Metrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

const METRIC_KEYS: (keyof Metrics)[] = [
  'scrollTop',
  'scrollHeight',
  'clientHeight',
  'scrollLeft',
  'scrollWidth',
  'clientWidth',
];

@Component({
  template: `@if (show()) {
    <div cngxScrollEdges #edges="cngxScrollEdges" class="box">
      <span class="readout">{{ edges.canScrollBlockEnd() }}</span>
    </div>
  }`,
  imports: [CngxScrollEdges],
})
class TestHost {
  readonly show = signal(true);
}

describe('CngxScrollEdges', () => {
  // jsdom has no layout, so the metrics are stubbed on the prototype (the
  // sticky-header spec technique) and read back from one mutable record.
  let metrics: Metrics;
  const saved = new Map<keyof Metrics, PropertyDescriptor | undefined>();
  let frames: FrameRequestCallback[];
  // scrollWidth is read exactly once per snapshot read.
  let reads = 0;

  function flushFrames(): void {
    const pending = frames;
    frames = [];
    pending.forEach((callback) => callback(0));
  }

  beforeEach(() => {
    metrics = {
      scrollTop: 0,
      scrollHeight: 100,
      clientHeight: 100,
      scrollLeft: 0,
      scrollWidth: 100,
      clientWidth: 100,
    };
    for (const key of METRIC_KEYS) {
      saved.set(key, Object.getOwnPropertyDescriptor(Element.prototype, key));
      Object.defineProperty(Element.prototype, key, {
        get: () => {
          if (key === 'scrollWidth') {
            reads++;
          }
          return metrics[key];
        },
        configurable: true,
      });
    }
    frames = [];
    reads = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => {
    for (const key of METRIC_KEYS) {
      const descriptor = saved.get(key);
      if (descriptor) {
        Object.defineProperty(Element.prototype, key, descriptor);
      } else {
        delete (Element.prototype as unknown as Record<string, unknown>)[key];
      }
    }
    saved.clear();
    vi.unstubAllGlobals();
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const debug = fixture.debugElement.query(By.directive(CngxScrollEdges));
    const box = debug.nativeElement as HTMLElement;
    const dir = debug.injector.get(CngxScrollEdges);
    const settle = () => {
      flushFrames();
      fixture.detectChanges();
    };
    return { fixture, box, dir, settle };
  }

  it('leaves every attribute off while the content fits', () => {
    const { box, settle } = setup();
    settle();

    expect(box.hasAttribute('data-scroll-block-start')).toBe(false);
    expect(box.hasAttribute('data-scroll-block-end')).toBe(false);
    expect(box.hasAttribute('data-scroll-inline-start')).toBe(false);
    expect(box.hasAttribute('data-scroll-inline-end')).toBe(false);
  });

  it('reflects a true edge as an empty attribute', () => {
    metrics.scrollHeight = 400;
    metrics.scrollWidth = 400;
    metrics.scrollTop = 150;
    const { box, settle } = setup();
    settle();

    expect(box.getAttribute('data-scroll-block-start')).toBe('');
    expect(box.getAttribute('data-scroll-block-end')).toBe('');
    expect(box.hasAttribute('data-scroll-inline-start')).toBe(false);
    expect(box.getAttribute('data-scroll-inline-end')).toBe('');
  });

  it('removes the attribute again when a scroll reaches the edge', () => {
    metrics.scrollHeight = 400;
    const { box, settle } = setup();
    settle();
    expect(box.getAttribute('data-scroll-block-end')).toBe('');

    metrics.scrollTop = 300;
    box.dispatchEvent(new Event('scroll'));
    settle();

    expect(box.hasAttribute('data-scroll-block-end')).toBe(false);
    expect(box.getAttribute('data-scroll-block-start')).toBe('');
  });

  it('exposes the signals through exportAs', () => {
    metrics.scrollHeight = 400;
    const { fixture, dir, settle } = setup();
    settle();

    expect(dir.canScrollBlockEnd()).toBe(true);
    const readout = fixture.nativeElement.querySelector('.readout') as HTMLElement;
    expect(readout.textContent?.trim()).toBe('true');
  });

  it('stops listening once destroyed', () => {
    metrics.scrollHeight = 400;
    const { fixture, box, settle } = setup();
    settle();
    const removeListener = vi.spyOn(box, 'removeEventListener');

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();

    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    flushFrames();
    const readsAtDestroy = reads;
    box.dispatchEvent(new Event('scroll'));
    flushFrames();
    expect(reads).toBe(readsAtDestroy);
  });
});
