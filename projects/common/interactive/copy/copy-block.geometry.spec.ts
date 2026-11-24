import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCopyBlock } from './copy-block';
import { CngxCopyText } from './copy-text.directive';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-copy-block)` block of copy-block.css lays the content payload next
// to the copy button on one flex row: the content grows and may shrink past
// its intrinsic width (min-width:0) while the button stays intrinsic and its
// tap area floors off `--cngx-target-min`. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxCopyBlock],
  template: `<cngx-copy-block [value]="'npm i @cngx/common'"
    ><code>npm i @cngx/common</code></cngx-copy-block
  >`,
})
class CopyHost {}

function mountFixture() {
  const fixture = TestBed.createComponent(CopyHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-copy-block');
  if (!host) {
    throw new Error('cngx-copy-block did not render');
  }
  return { fixture, host: host as HTMLElement };
}

function mount(): HTMLElement {
  return mountFixture().host;
}

// The computed colour of `background` as the engine serialises it, so a
// color-mix() expectation compares in the engine's own notation.
function paintedBackground(value: string): string {
  const probe = document.createElement('div');
  probe.style.background = value;
  mountedRoot!.appendChild(probe);
  const painted = computedValue(probe, 'background-color');
  probe.remove();
  return painted;
}

function paintedColor(value: string): string {
  const probe = document.createElement('div');
  probe.style.color = value;
  mountedRoot!.appendChild(probe);
  const painted = computedValue(probe, 'color');
  probe.remove();
  return painted;
}

// Runs one copy whose Clipboard API write rejects or resolves. The own
// property shadows Navigator.prototype.clipboard and is deleted again in
// afterEach.
async function copyWith(
  fixture: ReturnType<typeof mountFixture>['fixture'],
  outcome: 'reject' | 'resolve',
): Promise<HTMLElement> {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: () =>
        outcome === 'reject' ? Promise.reject(new Error('denied')) : Promise.resolve(),
    },
    writable: true,
    configurable: true,
  });
  const copyText = fixture.debugElement.query(By.directive(CngxCopyText)).injector.get(CngxCopyText);
  await copyText.copy();
  fixture.detectChanges();
  return query(fixture.nativeElement as HTMLElement, '.cngx-copy-block__button');
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('dir');
  delete (navigator as unknown as Record<string, unknown>)['clipboard'];
});

describe('CngxCopyBlock geometry', () => {
  it('lays the content and button on one flex row', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'align-items')).toBe('flex-start');
    // Content grows and may shrink below its intrinsic width.
    const content = query(host, '.cngx-copy-block__content');
    expect(computedValue(content, 'flex-grow')).toBe('1');
    expect(computedValue(content, 'min-width')).toBe('0px');
  });

  it('pins the button intrinsic and floors its tap area', () => {
    const host = mount();
    const button = query(host, '.cngx-copy-block__button');
    expect(computedValue(button, 'flex-shrink')).toBe('0');
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(button, 'min-inline-size')).toBe('44px');
    expect(computedValue(button, 'min-block-size')).toBe('44px');
  });

  it('isolates the projected payload under dir=rtl (isolate-only)', () => {
    document.documentElement.dir = 'rtl';
    const host = mount();
    const content = query(host, '.cngx-copy-block__content');
    expect(computedValue(content, 'unicode-bidi')).toBe('isolate');
  });
});

// The button radius and font size are registered with a fixed initial, so a
// use-site fallback never paints: the theme reaches them only through the SET.
// The copied palette is registered without an initial and derives at the use
// site.
describe('CngxCopyBlock theme-derived button tokens', () => {
  it('derives the button radius, font size and copied border from the theme', async () => {
    const { fixture } = mountFixture();
    mountedRoot!.style.setProperty('--cngx-duration-fast', '0s');
    mountedRoot!.style.setProperty('--cngx-radius-sm', '5px');
    mountedRoot!.style.setProperty('--cngx-font-size-sm', '11px');
    mountedRoot!.style.setProperty('--cngx-color-success', 'rgb(0, 128, 0)');
    const button = await copyWith(fixture, 'resolve');
    expect(computedValue(button, 'border-top-left-radius')).toBe('5px');
    expect(computedValue(button, 'font-size')).toBe('11px');
    expect(computedValue(button, 'border-top-color')).toBe('rgb(0, 128, 0)');
  });

  it('lets an ancestor SET of the button padding and copied border reach the button', async () => {
    const { fixture } = mountFixture();
    mountedRoot!.style.setProperty('--cngx-duration-fast', '0s');
    mountedRoot!.style.setProperty('--cngx-space-xs', '3px');
    mountedRoot!.style.setProperty('--cngx-space-sm', '7px');
    mountedRoot!.style.setProperty('--cngx-color-success', 'rgb(0, 128, 0)');
    mountedRoot!.style.setProperty('--cngx-copy-block-btn-padding', '1px 2px');
    mountedRoot!.style.setProperty('--cngx-copy-block-btn-copied-border', 'rgb(1, 2, 3)');

    const button = await copyWith(fixture, 'resolve');

    expect(computedValue(button, 'padding-top')).toBe('1px');
    expect(computedValue(button, 'padding-left')).toBe('2px');
    expect(computedValue(button, 'border-top-color')).toBe('rgb(1, 2, 3)');
  });

  it('derives the button padding from the space scale without an override', () => {
    const host = mount();
    mountedRoot!.style.setProperty('--cngx-space-xs', '3px');
    mountedRoot!.style.setProperty('--cngx-space-sm', '7px');
    const button = query(host, '.cngx-copy-block__button');
    expect(computedValue(button, 'padding-top')).toBe('3px');
    expect(computedValue(button, 'padding-left')).toBe('7px');
  });

  // --cngx-color-success-text is assigned on the scheme blocks of
  // system-tokens.css, so a subtree that re-themes success sets it too.
  it('derives the copied fill from the success token and the text from its text rung', async () => {
    const { fixture } = mountFixture();
    mountedRoot!.style.setProperty('--cngx-duration-fast', '0s');
    mountedRoot!.style.setProperty('--cngx-color-success', 'rgb(0, 0, 200)');
    mountedRoot!.style.setProperty('--cngx-color-success-text', 'rgb(0, 0, 120)');

    const button = await copyWith(fixture, 'resolve');

    expect(button.classList).toContain('cngx-copy-block__button--copied');
    expect(computedValue(button, 'background-color')).toBe(
      paintedBackground('color-mix(in oklab, rgb(0, 0, 200) 12%, transparent)'),
    );
    expect(computedValue(button, 'color')).toBe('rgb(0, 0, 120)');
  });
});

describe('CngxCopyBlock failed tint', () => {
  it('paints the failed fill, border and text from the danger tokens', async () => {
    const { fixture } = mountFixture();
    mountedRoot!.style.setProperty('--cngx-duration-fast', '0s');
    mountedRoot!.style.setProperty('--cngx-color-danger', 'rgb(200, 0, 0)');
    mountedRoot!.style.setProperty('--cngx-color-danger-text', 'rgb(120, 0, 0)');

    const button = await copyWith(fixture, 'reject');

    expect(button.classList).toContain('cngx-copy-block__button--failed');
    expect(computedValue(button, 'background-color')).toBe(
      paintedBackground('color-mix(in oklab, rgb(200, 0, 0) 12%, transparent)'),
    );
    expect(computedValue(button, 'border-top-color')).toBe('rgb(200, 0, 0)');
    expect(computedValue(button, 'color')).toBe('rgb(120, 0, 0)');
  });

  it('lets an ancestor SET of the failed tokens win', async () => {
    const { fixture } = mountFixture();
    mountedRoot!.style.setProperty('--cngx-duration-fast', '0s');
    mountedRoot!.style.setProperty('--cngx-copy-block-btn-failed-bg', 'rgb(1, 2, 3)');
    mountedRoot!.style.setProperty('--cngx-copy-block-btn-failed-border', 'rgb(4, 5, 6)');
    mountedRoot!.style.setProperty('--cngx-copy-block-btn-failed-color', 'rgb(7, 8, 9)');

    const button = await copyWith(fixture, 'reject');

    expect(computedValue(button, 'background-color')).toBe('rgb(1, 2, 3)');
    expect(computedValue(button, 'border-top-color')).toBe('rgb(4, 5, 6)');
    expect(computedValue(button, 'color')).toBe('rgb(7, 8, 9)');
  });

  it('keeps the idle tokens when the copy did not fail', () => {
    const host = mount();
    mountedRoot!.style.setProperty('--cngx-color-danger', 'rgb(200, 0, 0)');
    mountedRoot!.style.color = 'rgb(10, 20, 30)';
    const button = query(host, '.cngx-copy-block__button');

    expect(button.classList).not.toContain('cngx-copy-block__button--failed');
    expect(computedValue(button, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(button, 'color')).toBe(paintedColor('rgb(10, 20, 30)'));
  });
});

