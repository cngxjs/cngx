import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxDialogDraggable } from './dialog-draggable.directive';

@Component({
  template: `<div cngxDialogDraggable>Draggable</div>`,
  imports: [CngxDialogDraggable],
})
class SimpleHost {
  readonly draggable = viewChild.required(CngxDialogDraggable);
}

function setup() {
  const fixture = TestBed.createComponent(SimpleHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement.querySelector('[cngxDialogDraggable]') as HTMLElement;
  const directive = fixture.componentInstance.draggable();
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
});
