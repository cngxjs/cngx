import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxDialog } from '../dialog/dialog.directive';
import { CngxBottomSheet } from './bottom-sheet.directive';

@Component({
  template: `
    <dialog cngxDialog cngxBottomSheet [showHandle]="showHandle()" #sheet="cngxBottomSheet">
      <p>Sheet content</p>
    </dialog>
  `,
  imports: [CngxDialog, CngxBottomSheet],
})
class SheetHost {
  readonly showHandle = signal(true);
  readonly sheet = viewChild.required(CngxBottomSheet);
}

function setup() {
  const fixture = TestBed.createComponent(SheetHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const sheetEl = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
  return { fixture, sheetEl, host: fixture.componentInstance };
}

describe('CngxBottomSheet', () => {
  it('applies the bottom-sheet base class', () => {
    const { sheetEl } = setup();
    expect(sheetEl.classList.contains('cngx-bottom-sheet')).toBe(true);
  });

  it('shows the drag handle by default via the modifier class', () => {
    const { sheetEl } = setup();
    // The ::before handle pill in the component CSS is gated on this class.
    expect(sheetEl.classList.contains('cngx-bottom-sheet--handle')).toBe(true);
  });

  it('removes the modifier class when showHandle is false', () => {
    const { fixture, sheetEl, host } = setup();
    host.showHandle.set(false);
    fixture.detectChanges();
    expect(sheetEl.classList.contains('cngx-bottom-sheet--handle')).toBe(false);

    host.showHandle.set(true);
    fixture.detectChanges();
    expect(sheetEl.classList.contains('cngx-bottom-sheet--handle')).toBe(true);
  });
});
