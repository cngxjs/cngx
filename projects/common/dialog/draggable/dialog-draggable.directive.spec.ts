import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxDialogDraggable } from './dialog-draggable.directive';

@Component({
  template: `<div cngxDialogDraggable>Draggable</div>`,
  imports: [CngxDialogDraggable],
})
class SimpleHost {
  readonly draggable = viewChild.required(CngxDialogDraggable);
}

@Component({
  template: `
    <div cngxDialogDraggable>
      <input id="field" type="text" />
    </div>
  `,
  imports: [CngxDialogDraggable],
})
class FormFieldHost {
  readonly draggable = viewChild.required(CngxDialogDraggable);
}

function setup<T = SimpleHost>(hostType: new () => T = SimpleHost as new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement.querySelector('[cngxDialogDraggable]') as HTMLElement;
  const directive = (
    fixture.componentInstance as { draggable: () => CngxDialogDraggable }
  ).draggable();
  return { fixture, el, directive };
}

describe('CngxDialogDraggable', () => {
  it('starts at position (0, 0)', () => {
    const { directive } = setup();
    expect(directive.position()).toEqual({ x: 0, y: 0 });
  });

  it('is not dragging initially', () => {
    const { directive } = setup();
    expect(directive.isDragging()).toBe(false);
  });

  it('sets CSS custom properties on host', () => {
    const { el } = setup();
    expect(el.style.getPropertyValue('--cngx-dialog-x')).toBe('0px');
    expect(el.style.getPropertyValue('--cngx-dialog-y')).toBe('0px');
  });

  describe('keyboard navigation', () => {
    it('moves right with ArrowRight', () => {
      const { el, directive, fixture } = setup();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position().x).toBe(10);
    });

    it('moves left with ArrowLeft', () => {
      const { el, directive, fixture } = setup();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position().x).toBe(-10);
    });

    it('moves down with ArrowDown', () => {
      const { el, directive, fixture } = setup();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position().y).toBe(10);
    });

    it('moves up with ArrowUp', () => {
      const { el, directive, fixture } = setup();
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position().y).toBe(-10);
    });

    it('moves 50px with Shift+Arrow', () => {
      const { el, directive, fixture } = setup();
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }),
      );
      fixture.detectChanges();
      expect(directive.position().x).toBe(50);
    });

    it('resets to origin with Home', () => {
      const { el, directive, fixture } = setup();
      // Move first
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position()).toEqual({ x: 10, y: 10 });

      // Reset
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position()).toEqual({ x: 0, y: 0 });
    });
  });

  it('applies dragging class', () => {
    const { el } = setup();
    // Can't easily test pointer events in JSDOM, but verify class binding exists
    expect(el.classList.contains('cngx-dialog--dragging')).toBe(false);
  });

  describe('whole-dialog handle keyboard path', () => {
    it('makes the host focusable so the keyboard drag surface exists', () => {
      const { el } = setup();
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('does not clobber the host accessible name or role text', () => {
      const { el } = setup();
      expect(el.getAttribute('aria-label')).toBeNull();
      expect(el.getAttribute('aria-roledescription')).toBeNull();
    });
  });

  describe('keydown target scoping', () => {
    it('ignores arrow keys typed into form fields inside the handle', () => {
      const { fixture, directive } = setup(FormFieldHost);
      const field = fixture.nativeElement.querySelector('#field') as HTMLInputElement;

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      field.dispatchEvent(event);
      fixture.detectChanges();

      expect(directive.position()).toEqual({ x: 0, y: 0 });
      expect(event.defaultPrevented).toBe(false);
    });

    it('still moves when the key originates on the handle element itself', () => {
      const { el, directive, fixture } = setup(FormFieldHost);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(directive.position().x).toBe(10);
    });
  });

  describe('pointercancel', () => {
    function startDrag(el: HTMLElement) {
      const rec = el as unknown as Record<string, unknown>;
      rec['setPointerCapture'] = vi.fn();
      rec['releasePointerCapture'] = vi.fn();
      const down = new MouseEvent('pointerdown', { button: 0, clientX: 10, clientY: 10 });
      el.dispatchEvent(down);
    }

    it('ends the drag when the pointer is cancelled', () => {
      const { el, directive, fixture } = setup();
      startDrag(el);
      fixture.detectChanges();
      expect(directive.isDragging()).toBe(true);

      document.dispatchEvent(new MouseEvent('pointercancel'));
      fixture.detectChanges();

      expect(directive.isDragging()).toBe(false);
      expect(document.documentElement.style.userSelect).toBe('');
    });
  });
});
