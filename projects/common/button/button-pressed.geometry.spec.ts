import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxButton } from './button.component';
import { CngxCloseButton } from './close-button.component';
import { CngxIconButton } from './icon-button.component';

// Runs in a real Chromium (the `test-geometry` target). The pressed state is
// the hover mix one step stronger, on :active and on the `.cngx-pressed` class
// cngxPressable sets on pointerdown; a disabled button never shows it.
// Transitions are off so a computed colour read right after the change is the
// end state.

const VARIANTS = ['solid', 'secondary', 'outline', 'ghost'] as const;

@Component({
  selector: 'cngx-button-pressed-host',
  standalone: true,
  imports: [CngxButton, CngxIconButton, CngxCloseButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (variant of variants; track variant) {
      @for (tone of tones; track tone) {
        <button
          [cngxButton]="variant"
          [tone]="tone"
          class="b-{{ variant }}-{{ tone }}"
          style="transition: none"
        >
          Save
        </button>
        <button
          [cngxButton]="variant"
          [tone]="tone"
          disabled
          class="d-{{ variant }}-{{ tone }}"
          style="transition: none"
        >
          Save
        </button>
      }
    }
    <button cngxIconButton class="icon" style="transition: none" aria-label="Add">+</button>
    <button cngxCloseButton class="close" style="transition: none" aria-label="Close"></button>
    <button cngxCloseButton class="close-hooked" style="transition: none; --cngx-close-button-pressed-bg: rgb(0, 128, 0)" aria-label="Close"></button>
  `,
})
class PressedHost {
  readonly variants = VARIANTS;
  readonly tones = ['neutral', 'primary'] as const;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PressedHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function background(el: HTMLElement): string {
  return getComputedStyle(el).backgroundColor;
}

function pressedBackground(el: HTMLElement): { rest: string; pressed: string } {
  const rest = background(el);
  el.classList.add('cngx-pressed');
  const pressed = background(el);
  el.classList.remove('cngx-pressed');
  return { rest, pressed };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxButton geometry: pressed state', () => {
  it.each(VARIANTS)('tints a pressed %s button away from rest and hover', async (variant) => {
    const root = mount();
    for (const tone of ['neutral', 'primary']) {
      const btn = one(root, `.b-${variant}-${tone}`);
      const { rest, pressed } = pressedBackground(btn);
      expect(pressed, `${variant} ${tone}`).not.toBe(rest);
      await userEvent.hover(btn);
      const hover = background(btn);
      btn.classList.add('cngx-pressed');
      expect(background(btn), `${variant} ${tone} hover`).not.toBe(hover);
      btn.classList.remove('cngx-pressed');
      await userEvent.unhover(btn);
    }
  });

  it.each(VARIANTS)('never shows pressed on a disabled %s button', (variant) => {
    const root = mount();
    for (const tone of ['neutral', 'primary']) {
      const { rest, pressed } = pressedBackground(one(root, `.d-${variant}-${tone}`));
      expect(pressed, `${variant} ${tone}`).toBe(rest);
    }
  });

  it('paints the same pressed fill on :active (keyboard press) as on .cngx-pressed', async () => {
    const root = mount();
    const btn = one(root, '.b-solid-primary');
    const { pressed } = pressedBackground(btn);
    btn.focus();
    await userEvent.keyboard('{Space>}');
    expect(btn.matches(':active')).toBe(true);
    expect(background(btn)).toBe(pressed);
    await userEvent.keyboard('{/Space}');
  });

  it('presses the icon button and the close button through the shared core', () => {
    const root = mount();
    for (const selector of ['.icon', '.close']) {
      const { rest, pressed } = pressedBackground(one(root, selector));
      expect(pressed, selector).not.toBe(rest);
    }
    expect(pressedBackground(one(root, '.close-hooked')).pressed).toBe('rgb(0, 128, 0)');
  });
});
