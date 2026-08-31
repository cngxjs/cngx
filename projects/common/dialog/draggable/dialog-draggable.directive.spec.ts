import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxDialog } from '../dialog/dialog.directive';
import { CngxDialogDescription } from '../dialog/dialog-description.directive';
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

@Component({
  template: `
    <div cngxDialogDraggable [handle]="handle()">
      <div id="handle-a">A</div>
      <div id="handle-b">B</div>
    </div>
  `,
  imports: [CngxDialogDraggable],
})
class SwappableHandleHost {
  readonly handle = signal<HTMLElement | undefined>(undefined);
  readonly draggable = viewChild.required(CngxDialogDraggable);
}

@Component({
  template: `
    <dialog cngxDialog cngxDialogDraggable [handle]="handle()">
      <p cngxDialogDescription>Body</p>
      <div id="explicit-handle">drag me</div>
    </dialog>
  `,
  imports: [CngxDialog, CngxDialogDescription, CngxDialogDraggable],
})
class DialogDraggableHost {
  readonly handle = signal<HTMLElement | undefined>(undefined);
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

  it('keeps the position reference stable for value-equal writes', () => {
    const { el, directive, fixture } = setup();
    const before = directive.position();

    // Home at origin writes a fresh { x: 0, y: 0 } literal - the equal fn
    // must swallow it so per-frame snap writes do not notify consumers.
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();

    expect(directive.position()).toBe(before);
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

    it('resets the page-wide userSelect when destroyed mid-drag', () => {
      const { el, fixture } = setup();
      startDrag(el);
      fixture.detectChanges();
      expect(document.documentElement.style.userSelect).toBe('none');

      fixture.destroy();
      expect(document.documentElement.style.userSelect).toBe('');
    });
  });

  describe('handle swap teardown', () => {
    it('restores attributes and styles on the demoted handle', () => {
      const fixture = TestBed.createComponent(SwappableHandleHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;
      const handleA = fixture.nativeElement.querySelector('#handle-a') as HTMLElement;
      const handleB = fixture.nativeElement.querySelector('#handle-b') as HTMLElement;

      host.handle.set(handleA);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(handleA.getAttribute('tabindex')).toBe('0');
      expect(handleA.getAttribute('aria-label')).toBe('Move dialog');

      host.handle.set(handleB);
      fixture.detectChanges();
      TestBed.flushEffects();

      // The demoted handle must not stay focusable or keep announcing a
      // drag affordance whose keyboard path is gone.
      expect(handleA.getAttribute('tabindex')).toBeNull();
      expect(handleA.getAttribute('aria-label')).toBeNull();
      expect(handleA.getAttribute('aria-roledescription')).toBeNull();
      expect(handleA.style.cursor).toBe('');
      expect(handleB.getAttribute('tabindex')).toBe('0');
      expect(handleB.getAttribute('aria-label')).toBe('Move dialog');
    });

    it('does not strip a consumer-authored tabindex on teardown', () => {
      const fixture = TestBed.createComponent(SwappableHandleHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;
      const handleA = fixture.nativeElement.querySelector('#handle-a') as HTMLElement;
      const handleB = fixture.nativeElement.querySelector('#handle-b') as HTMLElement;
      handleA.setAttribute('tabindex', '-1');

      host.handle.set(handleA);
      fixture.detectChanges();
      TestBed.flushEffects();
      host.handle.set(handleB);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(handleA.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('keyboard affordance instruction', () => {
    it('renders a hidden instruction node in host-as-handle mode', () => {
      const { el } = setup();
      const hint = el.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;
      expect(hint).not.toBeNull();
      expect(hint.textContent).toBe('Use arrow keys to move the dialog; Shift for larger steps');
    });

    it('references the instruction directly on a registry-less host', () => {
      // No cngxDialog on the host, so no registry and no attribute owner -
      // the direct reference is the only channel left.
      const { el } = setup();
      const hint = el.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;
      expect(el.getAttribute('aria-describedby')).toBe(hint.id);
    });

    it('does not clobber a consumer-authored describedby on a registry-less host', () => {
      const fixture = TestBed.createComponent(SimpleHost);
      const el = fixture.nativeElement.querySelector('[cngxDialogDraggable]') as HTMLElement;
      el.setAttribute('aria-describedby', 'consumer-hint');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(el.getAttribute('aria-describedby')).toBe('consumer-hint');
    });

    it('links the instruction into the dialog aria-describedby after the description', () => {
      const fixture = TestBed.createComponent(DialogDraggableHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      const descId = (dialogEl.querySelector('[cngxDialogDescription]') as HTMLElement).id;
      const hint = dialogEl.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;

      expect(dialogEl.getAttribute('aria-describedby')).toBe(`${descId} ${hint.id}`);
    });

    it('moves the instruction to the explicit handle on swap, no dangling dialog ref', () => {
      const fixture = TestBed.createComponent(DialogDraggableHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      const descId = (dialogEl.querySelector('[cngxDialogDescription]') as HTMLElement).id;
      const explicitHandle = dialogEl.querySelector('#explicit-handle') as HTMLElement;
      const hostHint = dialogEl.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;
      expect(dialogEl.getAttribute('aria-describedby')).toBe(`${descId} ${hostHint.id}`);

      fixture.componentInstance.handle.set(explicitHandle);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      // The dialog-level reference leaves with the host-as-handle capability;
      // the recreated instruction is now referenced from the handle itself.
      const handleHint = dialogEl.querySelector('[id^="cngx-dialog-drag-hint"]') as HTMLElement;
      expect(dialogEl.getAttribute('aria-describedby')).toBe(descId);
      expect(handleHint).not.toBe(hostHint);
      expect(explicitHandle.getAttribute('aria-describedby')).toBe(handleHint.id);
    });

    it('restores the explicit handle describedby on swap back to host-as-handle', () => {
      const fixture = TestBed.createComponent(DialogDraggableHost);
      fixture.detectChanges();
      TestBed.flushEffects();

      const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      const explicitHandle = dialogEl.querySelector('#explicit-handle') as HTMLElement;

      fixture.componentInstance.handle.set(explicitHandle);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(explicitHandle.getAttribute('aria-describedby')).not.toBeNull();

      fixture.componentInstance.handle.set(undefined);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(explicitHandle.getAttribute('aria-describedby')).toBeNull();
    });

    it('does not clobber a consumer-authored describedby on the explicit handle', () => {
      const fixture = TestBed.createComponent(DialogDraggableHost);
      fixture.detectChanges();
      TestBed.flushEffects();

      const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
      const explicitHandle = dialogEl.querySelector('#explicit-handle') as HTMLElement;
      explicitHandle.setAttribute('aria-describedby', 'consumer-hint');

      fixture.componentInstance.handle.set(explicitHandle);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(explicitHandle.getAttribute('aria-describedby')).toBe('consumer-hint');

      fixture.componentInstance.handle.set(undefined);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(explicitHandle.getAttribute('aria-describedby')).toBe('consumer-hint');
    });
  });
});
