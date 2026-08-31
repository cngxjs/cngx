import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDialogOpener, provideDialog } from './dialog.service';

// jsdom versions differ in HTMLDialogElement support; the outlet's <dialog>
// is created dynamically, so the missing methods are polyfilled on the
// prototype before the opener can call them.
beforeEach(() => {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  proto['showModal'] ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['show'] ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['close'] ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

@Component({
  template: `<p id="dialog-content">content</p>`,
})
class TestContent {}

function createOpener(): CngxDialogOpener {
  TestBed.configureTestingModule({ providers: [provideDialog()] });
  return TestBed.inject(CngxDialogOpener);
}

describe('CngxDialogOpener', () => {
  it('opens a component dialog attached to body and removes it after close', () => {
    const opener = createOpener();
    const ref = opener.open<number>(TestContent);

    expect(document.body.querySelector('cngx-dialog-outlet')).not.toBeNull();
    expect(document.body.querySelector('#dialog-content')).not.toBeNull();

    ref.close(1);
    TestBed.flushEffects();

    expect(ref.result()).toBe(1);
    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
  });

  it('destroys the per-open cleanup effect after close', () => {
    const opener = createOpener();
    const ref = opener.open<number>(TestContent);
    expect(ref._cleanupEffect).not.toBeNull();

    ref.close(1);
    TestBed.flushEffects();

    // The effect's injector outlives the dialog - without the explicit
    // destroy every open() would leak one live effect.
    expect(ref._cleanupEffect).toBeNull();
  });

  it('closeAll dismisses every open dialog', () => {
    const opener = createOpener();
    opener.open(TestContent);
    opener.open(TestContent);
    expect(document.body.querySelectorAll('cngx-dialog-outlet').length).toBe(2);

    opener.closeAll();
    TestBed.flushEffects();

    expect(document.body.querySelectorAll('cngx-dialog-outlet').length).toBe(0);
  });
});
