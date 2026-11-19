import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). These tokens are
// registered with a fixed initial, so a use-site fallback never paints: the
// theme, the dark scheme and a parent token reach them only through a SET.
// Each probe paints the theme token it should follow on a plain element.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-theme-derived-tokens-host',
  standalone: true,
  styleUrls: [
    '../core/theming/layers.css',
    '../core/theming/system-tokens.css',
    './stepper/styles/stepper-base.css',
    './stepper/stepper.component.css',
    './speak/speak-button.css',
    './tabs/tab-overflow.component.css',
    './feedback/toast/toast-outlet.css',
    './feedback/loading/progress.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="probe-success" style="background: var(--cngx-color-success)"></span>
        <span class="probe-danger-text" style="color: var(--cngx-color-danger-text)"></span>
        <span class="probe-success-text" style="color: var(--cngx-color-success-text)"></span>
        <span class="probe-surface" style="background: var(--cngx-color-surface)"></span>
        <div class="cngx-stepper">
          <span class="cngx-stepper__indicator step-done" data-state="success"></span>
          <span class="cngx-stepper__indicator step-error" data-state="error"></span>
        </div>
        <div class="cngx-stepper" data-skin="breadcrumb">
          <div class="cngx-stepper__step">
            <span class="cngx-stepper__indicator" data-state="success"></span>
            <span class="cngx-stepper__done-icon breadcrumb-check"></span>
          </div>
        </div>
        <div class="cngx-speak-button">
          <button type="button" class="cngx-speak-button__btn speak-btn"></button>
        </div>
        <span
          class="probe-track"
          style="background: color-mix(in oklab, var(--cngx-color-text) 20%, transparent)"
        ></span>
        <div class="cngx-progress"><span class="cngx-progress__track progress-track"></span></div>
      </div>
    }
    <div class="cngx-speak-button" style="--cngx-speak-btn-active-color: oklch(0.5 0.2 300)">
      <span class="probe-active" style="background: oklch(0.5 0.2 300)"></span>
    </div>
    <div class="cngx-speak-button cngx-speak-button--speaking">
      <button
        type="button"
        class="cngx-speak-button__btn speak-speaking"
        style="--cngx-speak-btn-active-color: oklch(0.5 0.2 300)"
      ></button>
    </div>
    <div class="cngx-tab-overflow">
      <span
        class="cngx-tab-overflow__item cngx-tab-overflow__item--active overflow-active"
        style="--cngx-tab-overflow-item-hover-bg: oklch(0.5 0.2 300)"
      ></span>
    </div>
    <div class="cngx-toast-outlet">
      <div class="cngx-toast">
        <strong class="cngx-toast__title toast-title" style="--cngx-toast-font-size: 20px"
          >Saved</strong
        >
      </div>
    </div>
  `,
})
class DerivedTokensHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(DerivedTokensHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`missing ${selector}`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('ui theme-derived tokens', () => {
  it('fills the completed step with the success hue of the scheme', () => {
    const root = mount();
    for (const scheme of SCHEMES) {
      const at = (selector: string) => query(root, `.scheme-${scheme} ${selector}`);
      expect(computedValue(at('.step-done'), 'background-color')).toBe(
        computedValue(at('.probe-success'), 'background-color'),
      );
    }
  });

  it('paints the errored step in the danger text rung of the scheme', () => {
    const root = mount();
    for (const scheme of SCHEMES) {
      const at = (selector: string) => query(root, `.scheme-${scheme} ${selector}`);
      expect(computedValue(at('.step-error'), 'color')).toBe(
        computedValue(at('.probe-danger-text'), 'color'),
      );
    }
  });

  it('paints the breadcrumb check in the success text rung of the scheme', () => {
    const root = mount();
    for (const scheme of SCHEMES) {
      const at = (selector: string) => query(root, `.scheme-${scheme} ${selector}`);
      expect(computedValue(at('.breadcrumb-check'), 'color')).toBe(
        computedValue(at('.probe-success-text'), 'color'),
      );
    }
  });

  it('puts the speak button on the surface of the scheme', () => {
    const root = mount();
    for (const scheme of SCHEMES) {
      const at = (selector: string) => query(root, `.scheme-${scheme} ${selector}`);
      expect(computedValue(at('.speak-btn'), 'background-color')).toBe(
        computedValue(at('.probe-surface'), 'background-color'),
      );
    }
    const light = query(root, '.scheme-light .speak-btn');
    const dark = query(root, '.scheme-dark .speak-btn');
    expect(computedValue(dark, 'background-color')).not.toBe(
      computedValue(light, 'background-color'),
    );
  });

  it('fills the speaking button with the active colour', () => {
    const root = mount();
    expect(computedValue(query(root, '.speak-speaking'), 'background-color')).toBe(
      computedValue(query(root, '.probe-active'), 'background-color'),
    );
  });

  it('tints the active overflow item with the hover token', () => {
    const root = mount();
    expect(computedValue(query(root, '.overflow-active'), 'background-color')).toBe(
      computedValue(query(root, '.probe-active'), 'background-color'),
    );
  });

  it('mixes the progress track from the text colour of the scheme', () => {
    const root = mount();
    for (const scheme of SCHEMES) {
      const at = (selector: string) => query(root, `.scheme-${scheme} ${selector}`);
      expect(computedValue(at('.progress-track'), 'background-color')).toBe(
        computedValue(at('.probe-track'), 'background-color'),
      );
    }
  });

  it('sizes the toast title with the toast font size', () => {
    const root = mount();
    expect(computedValue(query(root, '.toast-title'), 'font-size')).toBe('20px');
  });
});
