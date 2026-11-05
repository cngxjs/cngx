import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_ICON_QUESTION, CNGX_ICON_X, type CngxIconData } from '@cngx/utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxIconSvg } from './icon-svg.component';

const WITH_MICRO: CngxIconData = {
  ...CNGX_ICON_X,
  micro: { viewBox: '0 0 12 12', d: 'M3 3H9V9H3Z' },
  small: null,
};

const WITH_SMALL: CngxIconData = {
  ...CNGX_ICON_X,
  micro: null,
  small: { viewBox: '0 0 16 16', d: 'M7 2H9V11H7Z' },
};

const WITH_BOTH: CngxIconData = {
  ...CNGX_ICON_X,
  micro: { viewBox: '0 0 12 12', d: 'M3 3H9V9H3Z' },
  small: { viewBox: '0 0 16 16', d: 'M7 2H9V11H7Z' },
};

// The tier each sibling path belongs to, in DOM order.
function tierOrder(el: SVGSVGElement): string[] {
  return Array.from(el.querySelectorAll('path')).map((p) =>
    p.classList.contains('cngx-icon-svg__micro')
      ? 'micro'
      : p.classList.contains('cngx-icon-svg__small')
        ? 'small'
        : 'path',
  );
}

@Component({
  template: `<svg class="standalone" [cngxIconSvg]="icon()"></svg>`,
  imports: [CngxIconSvg],
})
class IconSvgHost {
  readonly icon = signal<CngxIconData>(CNGX_ICON_QUESTION);
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
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_QUESTION.d);
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
    fixture.componentInstance.icon.set(CNGX_ICON_QUESTION);
    fixture.detectChanges();
    expect(standalone.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_QUESTION.d);
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
    fixture.componentInstance.icon.set(CNGX_ICON_QUESTION);
    fixture.detectChanges();
    expect(standalone.querySelectorAll('path').length).toBe(1);
    expect(standalone.querySelector('.cngx-icon-svg__micro')).toBeNull();
  });

  it('draws the small path third, hidden and filled by presentation attributes', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(WITH_BOTH);
    fixture.detectChanges();
    const paths = standalone.querySelectorAll('path');
    expect(paths.length).toBe(3);
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_X.d);
    expect(paths[1].classList.contains('cngx-icon-svg__micro')).toBe(true);
    const small = paths[2];
    expect(small.classList.contains('cngx-icon-svg__small')).toBe(true);
    expect(small.getAttribute('d')).toBe(WITH_BOTH.small?.d);
    expect(small.getAttribute('transform')).toBe('scale(1.5)');
    expect(small.getAttribute('fill')).toBe('currentColor');
    expect(small.getAttribute('stroke')).toBe('none');
    expect(small.getAttribute('display')).toBe('none');
  });

  it('drops the small path when the next icon has none', () => {
    const { fixture, standalone } = setup();
    fixture.componentInstance.icon.set(WITH_SMALL);
    fixture.detectChanges();
    fixture.componentInstance.icon.set(CNGX_ICON_QUESTION);
    fixture.detectChanges();
    expect(standalone.querySelector('.cngx-icon-svg__small')).toBeNull();
  });

  it('keeps the DOM order 24, micro, small through a full swap sequence', () => {
    const { fixture, standalone } = setup();
    const set = (icon: CngxIconData): void => {
      fixture.componentInstance.icon.set(icon);
      fixture.detectChanges();
    };
    expect(tierOrder(standalone)).toEqual(['path']);
    set(WITH_MICRO);
    expect(tierOrder(standalone)).toEqual(['path', 'micro']);
    set(WITH_SMALL);
    expect(tierOrder(standalone)).toEqual(['path', 'small']);
    set(WITH_BOTH);
    expect(tierOrder(standalone)).toEqual(['path', 'micro', 'small']);
    set(WITH_MICRO);
    expect(tierOrder(standalone)).toEqual(['path', 'micro']);
    set(CNGX_ICON_QUESTION);
    expect(tierOrder(standalone)).toEqual(['path']);
  });
});
