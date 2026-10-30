import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_ICON_CARET_DOWN, CNGX_ICON_X, type CngxIconData } from '@cngx/utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxIconSvg } from './icon-svg.component';

const WITH_MICRO: CngxIconData = {
  ...CNGX_ICON_X,
  micro: { viewBox: '0 0 12 12', d: 'M3 3H9V9H3Z' },
};

@Component({
  template: `<svg class="standalone" [cngxIconSvg]="icon()"></svg>`,
  imports: [CngxIconSvg],
})
class IconSvgHost {
  readonly icon = signal<CngxIconData>(CNGX_ICON_CARET_DOWN);
}

describe('CngxIconSvg', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [IconSvgHost] }));

  function setup() {
    const fixture = TestBed.createComponent(IconSvgHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      standalone: root.querySelector('svg.standalone') as SVGSVGElement,
    };
  }

  it('renders the viewBox and exactly one path', () => {
    const { standalone } = setup();
    expect(standalone.getAttribute('viewBox')).toBe('0 0 24 24');
    const paths = standalone.querySelectorAll('path');
    expect(paths.length).toBe(1);
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_CARET_DOWN.d);
    expect(paths[0].namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('is decorative', () => {
    const { standalone } = setup();
    expect(standalone.classList.contains('cngx-icon-svg')).toBe(true);
    expect(standalone.getAttribute('aria-hidden')).toBe('true');
    expect(standalone.getAttribute('focusable')).toBe('false');
  });

  it('leaves a fill icon without a fill attribute', () => {
    const { standalone } = setup();
    expect(standalone.hasAttribute('fill')).toBe(false);
    expect(standalone.classList.contains('cngx-icon-svg--stroke')).toBe(false);
  });

  it('marks a stroke icon with fill="none" and the stroke class', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(CNGX_ICON_X);
    fixture.detectChanges();
    expect(standalone.getAttribute('fill')).toBe('none');
    expect(standalone.classList.contains('cngx-icon-svg--stroke')).toBe(true);
  });

  it('redraws when the icon input changes', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(CNGX_ICON_X);
    fixture.detectChanges();
    expect(standalone.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_X.d);
    fixture.componentInstance.icon.set(CNGX_ICON_CARET_DOWN);
    fixture.detectChanges();
    expect(standalone.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_CARET_DOWN.d);
    expect(standalone.hasAttribute('fill')).toBe(false);
  });

  it('carries the shared glyph class and marks the 24-grid path', () => {
    const { standalone } = setup();
    expect(standalone.classList.contains('cngx-icon-glyph')).toBe(true);
    expect(standalone.querySelector('path')?.classList.contains('cngx-icon-svg__path')).toBe(true);
  });

  it('draws the micro path second, hidden and filled by presentation attributes', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(WITH_MICRO);
    fixture.detectChanges();
    const paths = standalone.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_X.d);
    const micro = paths[1];
    expect(micro.classList.contains('cngx-icon-svg__micro')).toBe(true);
    expect(micro.getAttribute('d')).toBe(WITH_MICRO.micro?.d);
    expect(micro.getAttribute('transform')).toBe('scale(2)');
    expect(micro.getAttribute('fill')).toBe('currentColor');
    expect(micro.getAttribute('stroke')).toBe('none');
    expect(micro.getAttribute('display')).toBe('none');
  });

  it('drops the micro path when the next icon has none', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(WITH_MICRO);
    fixture.detectChanges();
    fixture.componentInstance.icon.set(CNGX_ICON_CARET_DOWN);
    fixture.detectChanges();
    expect(standalone.querySelectorAll('path').length).toBe(1);
    expect(standalone.querySelector('.cngx-icon-svg__micro')).toBeNull();
  });
});
