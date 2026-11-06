import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxResizable } from './resizable.directive';

// Runs in a real Chromium (the `test-geometry` target): real layout, real
// pointer capture and animation frames.

@Component({
  selector: 'cngx-resizable-geometry-host',
  standalone: true,
  imports: [CngxResizable],
  encapsulation: ViewEncapsulation.None,
  styles: `
    .rz-row {
      display: flex;
      inline-size: 900px;
      block-size: 200px;
    }
    .rz-panel {
      flex: none;
    }
    .rz-handle {
      flex: none;
      inline-size: 8px;
    }
    .rz-main {
      flex: 1;
    }
  `,
  template: `
    <div class="rz-row" [attr.dir]="dir()">
      <aside class="rz-panel" [style.inline-size.px]="size()"></aside>
      <div class="rz-handle" cngxResizable [(size)]="size" [min]="150" [max]="500"></div>
      <main class="rz-main"></main>
    </div>
  `,
})
class GeometryHost {
  readonly size = signal(240);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('CngxResizable geometry', () => {
  let host: HTMLElement | null = null;

  afterEach(() => {
    host?.remove();
    host = null;
  });

  function mount(rtl = false) {
    if (rtl) {
      TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    }
    const fixture = TestBed.createComponent(GeometryHost);
    fixture.componentInstance.dir.set(rtl ? 'rtl' : 'ltr');
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    fixture.detectChanges();
    const q = (sel: string) => host?.querySelector(sel) as HTMLElement;
    return { fixture, panel: q('.rz-panel'), handle: q('.rz-handle') };
  }

  async function drag(
    fixture: ReturnType<typeof mount>['fixture'],
    handle: HTMLElement,
    dx: number,
  ) {
    const rect = handle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const init = { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientY: y };
    handle.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x }));
    handle.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + dx / 2 }));
    handle.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: x + dx }));
    await nextFrame();
    fixture.detectChanges();
    handle.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: x + dx }));
    fixture.detectChanges();
  }

  it('resizes the panel by the drag distance', async () => {
    const { fixture, panel, handle } = mount();
    expect(panel.getBoundingClientRect().width).toBe(240);

    await drag(fixture, handle, 60);

    expect(panel.getBoundingClientRect().width).toBe(300);
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
  });

  it('applies intermediate sizes on the animation frame during the drag', async () => {
    const { fixture, panel, handle } = mount();
    const rect = handle.getBoundingClientRect();
    const init = { bubbles: true, pointerId: 1, button: 0, clientY: rect.top + 4 };
    handle.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: rect.left }));
    handle.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: rect.left + 40 }));
    await nextFrame();
    fixture.detectChanges();

    expect(panel.getBoundingClientRect().width).toBe(280);
    handle.dispatchEvent(new PointerEvent('pointerup', { ...init, clientX: rect.left + 40 }));
  });

  it('clamps the drag to max', async () => {
    const { fixture, panel, handle } = mount();
    await drag(fixture, handle, 600);
    expect(panel.getBoundingClientRect().width).toBe(500);
  });

  it('grows the panel toward the physical left under rtl', async () => {
    const { fixture, panel, handle } = mount(true);
    const before = handle.getBoundingClientRect().left;

    await drag(fixture, handle, -60);

    expect(panel.getBoundingClientRect().width).toBe(300);
    expect(handle.getBoundingClientRect().left).toBeCloseTo(before - 60, 0);
  });
});
