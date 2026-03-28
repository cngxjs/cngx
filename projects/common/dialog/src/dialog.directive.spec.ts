import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxDialog } from './dialog.directive';
import { CngxDialogTitle } from './dialog-title.directive';
import { CngxDialogDescription } from './dialog-description.directive';
import { CngxDialogClose } from './dialog-close.directive';
import { CngxDialogStack, provideDialogStack } from './dialog-stack';

// ── Test helpers ────────────────────────────────────────────────────────

// JSDOM does not implement HTMLDialogElement.showModal/show/close, so we stub them.
function stubDialogElement(el: HTMLDialogElement): void {
  el.showModal ??= vi.fn(() => {
    el.setAttribute('open', '');
  });
  el.show ??= vi.fn(() => {
    el.setAttribute('open', '');
  });
  const originalClose = el.close?.bind(el);
  el.close = vi.fn((returnValue?: string) => {
    el.removeAttribute('open');
    if (originalClose) {
      try {
        originalClose(returnValue);
      } catch {
        // JSDOM may throw
      }
    }
  });
  // Stub getComputedStyle to report no transitions (skip closing state)
  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `
    <dialog cngxDialog #dlg="cngxDialog">
      <h2 cngxDialogTitle>Test Title</h2>
      <p cngxDialogDescription>Test Description</p>
      <button [cngxDialogClose]="true" id="confirm">Confirm</button>
      <button cngxDialogClose id="dismiss">Dismiss</button>
    </dialog>
  `,
  imports: [CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose],
})
class FullDialogHost {
  readonly dialog = viewChild.required(CngxDialog);
}

@Component({
  template: `<dialog cngxDialog [modal]="modal()" #dlg="cngxDialog"></dialog>`,
  imports: [CngxDialog],
})
class ModalToggleHost {
  readonly modal = signal(true);
  readonly dialog = viewChild.required(CngxDialog);
}

@Component({
  template: `
    <dialog cngxDialog [closeOnBackdropClick]="false" [closeOnEscape]="false" #dlg="cngxDialog">
      <h2 cngxDialogTitle>Blocking</h2>
    </dialog>
  `,
  imports: [CngxDialog, CngxDialogTitle],
})
class BlockingDialogHost {
  readonly dialog = viewChild.required(CngxDialog);
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
  stubDialogElement(dialogEl);
  return { fixture, dialogEl };
}

/** Open dialog fully — flushes the rAF so state becomes 'open'. */
function openFully<T extends { dialog: ReturnType<typeof viewChild.required<CngxDialog>> }>(
  fixture: { componentInstance: T; detectChanges: () => void },
  dialogEl: HTMLDialogElement,
): CngxDialog {
  const dialog = fixture.componentInstance.dialog();
  dialog.open();
  vi.advanceTimersByTime(16); // flush requestAnimationFrame
  fixture.detectChanges();
  TestBed.flushEffects();
  return dialog;
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxDialog', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('initial state', () => {
    it('starts in closed state', () => {
      const { fixture } = setup(FullDialogHost);
      expect(fixture.componentInstance.dialog().lifecycle()).toBe('closed');
    });

    it('result is undefined initially', () => {
      const { fixture } = setup(FullDialogHost);
      expect(fixture.componentInstance.dialog().result()).toBeUndefined();
    });

    it('has a unique id', () => {
      const { fixture } = setup(FullDialogHost);
      expect(fixture.componentInstance.dialog().id()).toMatch(/^cngx-dialog-\d+$/);
    });
  });

  describe('open()', () => {
    it('transitions to opening then open', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      dialog.open();
      expect(dialog.lifecycle()).toBe('opening');
      expect(dialogEl.showModal).toHaveBeenCalled();

      // Simulate afterNextRender — flush effects
      fixture.detectChanges();
      TestBed.flushEffects();
    });

    it('calls showModal() when modal is true', () => {
      const { fixture, dialogEl } = setup(ModalToggleHost);
      fixture.componentInstance.dialog().open();
      expect(dialogEl.showModal).toHaveBeenCalled();
    });

    it('calls show() when modal is false', () => {
      const { fixture, dialogEl } = setup(ModalToggleHost);
      fixture.componentInstance.modal.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();

      fixture.componentInstance.dialog().open();
      expect(dialogEl.show).toHaveBeenCalled();
    });

    it('resets result from previous cycle', () => {
      const { fixture } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      dialog.open();
      dialog.close('first' as unknown as never);
      expect(dialog.result()).toBe('first');

      // Re-open resets result
      dialog.open();
      expect(dialog.result()).toBeUndefined();
    });

    it('does nothing if already open', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();
      dialog.open(); // second call
      expect(dialogEl.showModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('close()', () => {
    it('sets result and transitions to closed (no transition)', () => {
      const { fixture } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      dialog.open();
      dialog.close(42 as unknown as never);

      // No transition → skips closing, goes straight to closed
      expect(dialog.lifecycle()).toBe('closed');
      expect(dialog.result()).toBe(42);
    });
  });

  describe('dismiss()', () => {
    it('sets result to dismissed', () => {
      const { fixture } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      dialog.open();
      dialog.dismiss();

      expect(dialog.lifecycle()).toBe('closed');
      expect(dialog.result()).toBe('dismissed');
    });
  });

  describe('Escape handling', () => {
    it('dismisses on cancel event when closeOnEscape is true', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();

      const cancelEvent = new Event('cancel', { cancelable: true });
      dialogEl.dispatchEvent(cancelEvent);
      fixture.detectChanges();

      expect(cancelEvent.defaultPrevented).toBe(true);
      expect(dialog.result()).toBe('dismissed');
    });

    it('does not dismiss when closeOnEscape is false', () => {
      const { fixture, dialogEl } = setup(BlockingDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();

      const cancelEvent = new Event('cancel', { cancelable: true });
      dialogEl.dispatchEvent(cancelEvent);
      fixture.detectChanges();

      expect(cancelEvent.defaultPrevented).toBe(true);
      expect(dialog.lifecycle()).not.toBe('closed');
    });
  });

  describe('backdrop click', () => {
    it('dismisses when click is outside dialog rect', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = openFully(fixture, dialogEl);
      expect(dialog.lifecycle()).toBe('open');

      // Mock getBoundingClientRect to simulate a dialog at (100, 100) to (400, 300)
      vi.spyOn(dialogEl, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        right: 400,
        top: 100,
        bottom: 300,
        width: 300,
        height: 200,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      });

      // Click outside (at 50, 50)
      const click = new MouseEvent('click', { clientX: 50, clientY: 50, bubbles: true });
      dialogEl.dispatchEvent(click);
      fixture.detectChanges();

      expect(dialog.result()).toBe('dismissed');
    });

    it('does not dismiss when closeOnBackdropClick is false', () => {
      const { fixture, dialogEl } = setup(BlockingDialogHost);
      const dialog = openFully(fixture, dialogEl);

      vi.spyOn(dialogEl, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        right: 400,
        top: 100,
        bottom: 300,
        width: 300,
        height: 200,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      });

      const click = new MouseEvent('click', { clientX: 50, clientY: 50, bubbles: true });
      dialogEl.dispatchEvent(click);
      fixture.detectChanges();

      expect(dialog.lifecycle()).not.toBe('closed');
    });
  });

  describe('ARIA', () => {
    it('sets aria-labelledby from CngxDialogTitle', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();
      fixture.detectChanges();
      TestBed.flushEffects();

      const labelledBy = dialogEl.getAttribute('aria-labelledby');
      expect(labelledBy).toMatch(/-title$/);
    });

    it('sets aria-describedby from CngxDialogDescription', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();
      fixture.detectChanges();
      TestBed.flushEffects();

      const describedBy = dialogEl.getAttribute('aria-describedby');
      expect(describedBy).toMatch(/-desc$/);
    });

    it('sets aria-modal only when modal and not closed', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      // Closed → no aria-modal
      fixture.detectChanges();
      expect(dialogEl.getAttribute('aria-modal')).toBeNull();

      // Open modal → aria-modal="true"
      dialog.open();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(dialogEl.getAttribute('aria-modal')).toBe('true');
    });

    it('contains an aria-live region', () => {
      const { dialogEl } = setup(FullDialogHost);
      const liveRegion = dialogEl.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });
  });

  describe('CSS classes', () => {
    it('applies opening class immediately, open class after rAF', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();

      expect(dialogEl.classList.contains('cngx-dialog--open')).toBe(false);

      dialog.open();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(dialogEl.classList.contains('cngx-dialog--opening')).toBe(true);

      // After rAF, transitions to open
      vi.advanceTimersByTime(16);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(dialogEl.classList.contains('cngx-dialog--open')).toBe(true);
      expect(dialogEl.classList.contains('cngx-dialog--opening')).toBe(false);
    });
  });

  describe('cleanup on destroy', () => {
    it('finalizes on destroy if open', () => {
      const { fixture, dialogEl } = setup(FullDialogHost);
      const dialog = fixture.componentInstance.dialog();
      dialog.open();

      fixture.destroy();
      expect(dialogEl.close).toHaveBeenCalled();
    });
  });
});

describe('CngxDialogClose', () => {
  it('closes with value when value is provided', () => {
    const { fixture } = setup(FullDialogHost);
    const dialog = fixture.componentInstance.dialog();
    dialog.open();

    const confirmBtn = fixture.nativeElement.querySelector('#confirm') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(dialog.result()).toBe(true);
    expect(dialog.lifecycle()).toBe('closed');
  });

  it('dismisses when no value is provided', () => {
    const { fixture } = setup(FullDialogHost);
    const dialog = fixture.componentInstance.dialog();
    dialog.open();

    const dismissBtn = fixture.nativeElement.querySelector('#dismiss') as HTMLButtonElement;
    dismissBtn.click();
    fixture.detectChanges();

    expect(dialog.result()).toBe('dismissed');
  });

  it('sets type="button" on button hosts', () => {
    const { fixture } = setup(FullDialogHost);
    const btn = fixture.nativeElement.querySelector('#confirm') as HTMLButtonElement;
    expect(btn.getAttribute('type')).toBe('button');
  });
});

describe('CngxDialogTitle', () => {
  it('sets id on the title element', () => {
    const { fixture } = setup(FullDialogHost);
    const titleEl = fixture.nativeElement.querySelector('[cngxDialogTitle]') as HTMLElement;
    expect(titleEl.id).toMatch(/-title$/);
  });
});

describe('CngxDialogDescription', () => {
  it('sets id on the description element', () => {
    const { fixture } = setup(FullDialogHost);
    const descEl = fixture.nativeElement.querySelector('[cngxDialogDescription]') as HTMLElement;
    expect(descEl.id).toMatch(/-desc$/);
  });
});

describe('CngxDialogStack', () => {
  it('tracks pushed dialog IDs', () => {
    const stack = new CngxDialogStack();
    stack.push('a');
    stack.push('b');
    expect(stack.topmost()).toBe('b');
    expect(stack.stack()).toEqual(['a', 'b']);
  });

  it('pops dialog IDs', () => {
    const stack = new CngxDialogStack();
    stack.push('a');
    stack.push('b');
    stack.pop('b');
    expect(stack.topmost()).toBe('a');
  });

  it('returns null when empty', () => {
    const stack = new CngxDialogStack();
    expect(stack.topmost()).toBeNull();
  });

  it('removes specific ID from anywhere in stack', () => {
    const stack = new CngxDialogStack();
    stack.push('a');
    stack.push('b');
    stack.push('c');
    stack.pop('b');
    expect(stack.stack()).toEqual(['a', 'c']);
    expect(stack.topmost()).toBe('c');
  });

  it('integrates with CngxDialog when provided', () => {
    TestBed.configureTestingModule({
      providers: [provideDialogStack()],
    });

    const stack = TestBed.inject(CngxDialogStack);
    const fixture = TestBed.createComponent(FullDialogHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const dialogEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    stubDialogElement(dialogEl);

    const dialog = fixture.componentInstance.dialog();
    dialog.open();

    expect(stack.stack().length).toBe(1);
    expect(stack.topmost()).toBe(dialog.id());

    dialog.close(true as unknown as never);
    expect(stack.stack().length).toBe(0);
  });
});
