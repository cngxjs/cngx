import { TestBed } from '@angular/core/testing';
import {
  CNGX_ICON_ALERT,
  CNGX_ICON_CHECK_CIRCLE,
  CNGX_ICON_INFO_CIRCLE,
  CNGX_ICON_X_CIRCLE,
  type CngxIconData,
} from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import type { AlertSeverity } from '../alert/alert';
import { CngxSeverityIcon } from './severity-icon';

function render(severity: AlertSeverity, iconClass = 'cngx-alert__default-icon'): SVGElement {
  const fixture = TestBed.createComponent(CngxSeverityIcon);
  fixture.componentRef.setInput('severity', severity);
  fixture.componentRef.setInput('iconClass', iconClass);
  fixture.detectChanges();
  const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
  if (!svg) {
    throw new Error('cngx-severity-icon rendered no svg');
  }
  return svg;
}

const CASES: ReadonlyArray<[AlertSeverity, CngxIconData]> = [
  ['info', CNGX_ICON_INFO_CIRCLE],
  ['success', CNGX_ICON_CHECK_CIRCLE],
  ['warning', CNGX_ICON_ALERT],
  ['error', CNGX_ICON_X_CIRCLE],
];

describe('CngxSeverityIcon', () => {
  it.each(CASES)('draws the %s severity from the shared icon set', (severity, icon) => {
    const svg = render(severity);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(icon.d);
    expect(svg.getAttribute('viewBox')).toBe(icon.viewBox);
  });

  it('gives every severity a distinct shape, so colour is never the only cue', () => {
    const shapes = new Set(
      CASES.map(([severity]) => render(severity).querySelector('path')?.getAttribute('d')),
    );
    expect(shapes.size).toBe(CASES.length);
  });

  it('keeps the renderer class next to the bound icon class and hides the glyph', () => {
    const svg = render('error', 'cngx-toast__default-icon');
    expect(svg.classList.contains('cngx-toast__default-icon')).toBe(true);
    expect(svg.classList.contains('cngx-icon-svg')).toBe(true);
    expect(svg.classList.contains('cngx-icon-svg--stroke')).toBe(true);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
