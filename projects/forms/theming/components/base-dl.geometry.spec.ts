import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Computed tier for the bare `<dl>` of core base.css (it ships in the
// aggregated cngx.css and sits on no component styleUrl; this target already
// renders base.css for the field specs). The description term is quiet by
// colour, never opacity: the muted text colour at full opacity, the value in
// the text colour. The source contract lives in core base-dl.spec.ts.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-base-dl-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', '../../../core/theming/base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="color: var(--cngx-color-text)"
      >
        <dl>
          <dt>Owner</dt>
          <dd>Ada</dd>
        </dl>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span class="probe-text" style="color: var(--cngx-color-text)"></span>
      </div>
    }
  `,
})
class BaseDlHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(BaseDlHost);
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('bare dl, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the term in the muted text colour at full opacity', () => {
    const root = mount();
    const dt = at(root, 'dt');
    expect(computedValue(dt, 'opacity')).toBe('1');
    expect(computedValue(dt, 'color')).toBe(computedValue(at(root, '.probe-muted'), 'color'));
  });

  it('keeps the value in the text colour', () => {
    const root = mount();
    expect(computedValue(at(root, 'dd'), 'color')).toBe(computedValue(at(root, '.probe-text'), 'color'));
  });
});
