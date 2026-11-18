/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The palette writes
// `<dialog cngxDialog>`, so the dialog skin's scope reaches it. The palette
// sets the skin's max-width hook and its own gutter: its width comes from
// --cngx-command-width, not the skin's 560px cap, and its overflow: hidden box
// reserves no both-edges scrollbar gutter.

@Component({
  selector: 'cngx-command-palette-dialog-skin-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-dialog.css',
    './palette/command-palette.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="position: relative; inline-size: 1000px">
      <dialog cngxDialog open class="cngx-command-palette" style="--cngx-command-width: 640px">
        Palette
      </dialog>
    </div>
  `,
})
class PaletteDialogSkinHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PaletteDialogSkinHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const dialog = mountedRoot.querySelector<HTMLElement>('dialog');
  if (!dialog) {
    throw new Error('dialog did not render');
  }
  return dialog;
}

describe('command palette under the dialog skin', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  it('takes its width from --cngx-command-width, not the skin max-width cap', () => {
    const dialog = mount();

    expect(computedValue(dialog, 'width')).toBe('640px');
  });

  it('reserves no scrollbar gutter on its overflow: hidden box', () => {
    const dialog = mount();

    expect(computedValue(dialog, 'scrollbar-gutter')).toBe('auto');
  });
});
