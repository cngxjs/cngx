import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDialog } from './dialog.directive';
import { CngxDialogClose } from './dialog-close.directive';
import { CngxDialogTitle } from './dialog-title.directive';

@Component({
  standalone: true,
  imports: [CngxDialog, CngxDialogClose, CngxDialogTitle],
  template: `
    <dialog cngxDialog [open]="true">
      <h2 cngxDialogTitle>Title</h2>
      <button type="button" class="static" cngxDialogClose aria-label="Dismiss settings"></button>
      <button type="button" class="input" cngxDialogClose [cngxDialogCloseLabel]="label()"></button>
      <button type="button" class="fallback" cngxDialogClose></button>
      <button type="button" class="text" cngxDialogClose>Cancel</button>
    </dialog>
  `,
})
class Host {
  readonly label = signal<string | undefined>('Close settings');
}

describe('CngxDialogClose accessible name', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const name = (cls: string): string | null =>
      root.querySelector(`button.${cls}`)!.getAttribute('aria-label');
    return { fixture, name };
  }

  it('keeps a static consumer aria-label on the host', () => {
    const { name } = setup();
    expect(name('static')).toBe('Dismiss settings');
  });

  it('names the button from cngxDialogCloseLabel and follows its changes', () => {
    const { fixture, name } = setup();
    expect(name('input')).toBe('Close settings');

    fixture.componentInstance.label.set('Schließen');
    fixture.detectChanges();
    expect(name('input')).toBe('Schließen');
  });

  it('falls back to the bundle for an icon-only button and stays silent on a text button', () => {
    const { name } = setup();
    expect(name('fallback')).toBe('Close dialog');
    expect(name('text')).toBeNull();
  });
});
