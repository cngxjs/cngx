import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
import { describe, expect, it, vi } from 'vitest';

import { provideLayoutI18n, withLayoutI18nLabels } from '../i18n/layout-i18n';
import { CngxResizable, type CngxResizableEdge } from './resizable.directive';

@Component({
  template: `
    <div
      cngxResizable
      [(size)]="size"
      [min]="100"
      [max]="400"
      [step]="10"
      [edge]="edge()"
      [label]="label()"
      [valueText]="valueText()"
    ></div>
  `,
  imports: [CngxResizable],
})
class Host {
  readonly size = signal(200);
  readonly edge = signal<CngxResizableEdge>('inline-end');
  readonly label = signal<string | undefined>(undefined);
  readonly valueText = signal<((size: number) => string) | undefined>(undefined);
}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [Host], providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const handle = (fixture.nativeElement as HTMLElement).querySelector(
    '[cngxResizable]',
  ) as HTMLElement;
  const key = (k: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', {
      key: k,
      bubbles: true,
      cancelable: true,
      ...init,
    });
    handle.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  return { fixture, host: fixture.componentInstance, handle, key };
}

describe('CngxResizable', () => {
  describe('ARIA', () => {
    it('renders a vertical separator with the value range', () => {
      const { handle } = setup();
      expect(handle.getAttribute('role')).toBe('separator');
      expect(handle.getAttribute('tabindex')).toBe('0');
      expect(handle.getAttribute('aria-orientation')).toBe('vertical');
      expect(handle.getAttribute('aria-valuenow')).toBe('200');
      expect(handle.getAttribute('aria-valuemin')).toBe('100');
      expect(handle.getAttribute('aria-valuemax')).toBe('400');
    });

    it('names the handle and speaks the size from the layout i18n defaults', () => {
      const { handle } = setup();
      expect(handle.getAttribute('aria-label')).toBe('Resize');
      expect(handle.getAttribute('aria-valuetext')).toBe('200 pixels');
    });

    it('follows a size change', () => {
      const { fixture, host, handle } = setup();
      host.size.set(250);
      fixture.detectChanges();
      expect(handle.getAttribute('aria-valuenow')).toBe('250');
      expect(handle.getAttribute('aria-valuetext')).toBe('250 pixels');
    });

    it('lets bound inputs win over the i18n copy', () => {
      const { fixture, host, handle } = setup();
      host.label.set('Resize filters');
      host.valueText.set((size) => `${size} px wide`);
      fixture.detectChanges();
      expect(handle.getAttribute('aria-label')).toBe('Resize filters');
      expect(handle.getAttribute('aria-valuetext')).toBe('200 px wide');
    });

    it('reads overridden layout copy', () => {
      const { handle } = setup([
        provideLayoutI18n(
          withLayoutI18nLabels({
            resizeHandle: 'Größe ändern',
            resizeValueText: (size) => `${size} Pixel`,
          }),
        ),
      ]);
      expect(handle.getAttribute('aria-label')).toBe('Größe ändern');
      expect(handle.getAttribute('aria-valuetext')).toBe('200 Pixel');
    });
  });

  describe('keyboard', () => {
    it('grows on ArrowRight and shrinks on ArrowLeft for an inline-end handle', () => {
      const { host, key } = setup();
      expect(key('ArrowRight').defaultPrevented).toBe(true);
      expect(host.size()).toBe(210);
      key('ArrowLeft');
      key('ArrowLeft');
      expect(host.size()).toBe(190);
    });

    it('inverts the arrows for an inline-start handle', () => {
      const { fixture, host, key } = setup();
      host.edge.set('inline-start');
      fixture.detectChanges();
      key('ArrowLeft');
      expect(host.size()).toBe(210);
    });

    it('inverts the arrows under rtl', () => {
      const { host, key } = setup([provideDirection('rtl')]);
      key('ArrowLeft');
      expect(host.size()).toBe(210);
    });

    it('jumps to min on Home and max on End', () => {
      const { host, key } = setup();
      key('Home');
      expect(host.size()).toBe(100);
      key('End');
      expect(host.size()).toBe(400);
    });

    it('clamps at the bounds', () => {
      const { fixture, host, key } = setup();
      host.size.set(395);
      fixture.detectChanges();
      key('ArrowRight');
      expect(host.size()).toBe(400);
    });

    it('leaves modified and unrelated keys alone', () => {
      const { host, key } = setup();
      expect(key('ArrowRight', { shiftKey: true }).defaultPrevented).toBe(false);
      expect(key('a').defaultPrevented).toBe(false);
      expect(host.size()).toBe(200);
    });
  });

  describe('pointer drag', () => {
    function drag(handle: HTMLElement, fromX: number, toX: number) {
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: fromX, button: 0 }),
      );
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: toX }));
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: toX }));
    }

    it('commits the dragged size on pointerup', () => {
      const { host, handle } = setup();
      drag(handle, 300, 350);
      expect(host.size()).toBe(250);
    });

    it('clamps a drag past max', () => {
      const { host, handle } = setup();
      drag(handle, 300, 900);
      expect(host.size()).toBe(400);
    });

    it('reports resizing while the pointer is down', () => {
      const { fixture, handle } = setup();
      const resizable = fixture.debugElement.children[0].injector.get(CngxResizable);
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: 0, button: 0 }),
      );
      fixture.detectChanges();
      expect(resizable.resizing()).toBe(true);
      expect(handle.classList).toContain('cngx-resizable--resizing');
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      fixture.detectChanges();
      expect(resizable.resizing()).toBe(false);
    });

    it('stops listening after the host is destroyed mid-drag', () => {
      const { fixture, host, handle } = setup();
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: 0, button: 0 }),
      );
      fixture.destroy();
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 80 }));
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 80 }));
      expect(host.size()).toBe(200);
    });

    it('drops the queued frame when the host is destroyed after a move', () => {
      const frames = new Map<number, FrameRequestCallback>();
      let nextFrame = 1;
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        frames.set(nextFrame, cb);
        return nextFrame++;
      });
      vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
      const { fixture, host, handle } = setup();
      handle.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: 0, button: 0 }),
      );
      const before = new Set(frames.keys());
      document.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 80 }));
      const dragFrames = [...frames.keys()].filter((id) => !before.has(id));
      expect(dragFrames).toHaveLength(1);

      fixture.destroy();

      expect(frames.has(dragFrames[0])).toBe(false);
      expect(host.size()).toBe(200);
    });
  });
});
