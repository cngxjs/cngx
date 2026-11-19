import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxCardAccent, type CngxCardAccentSeverity } from './card-accent.directive';
import { CngxCardAccentIcon } from './card-accent-icon.component';
import { CngxCardTitle } from './card-title.directive';
import { provideCardI18n, withCardI18nLabels } from './i18n/card-i18n';

@Component({
  template: `
    <div [cngxCardAccent]="severity()">
      <h3 cngxCardTitle><cngx-card-accent-icon />Blood sugar</h3>
    </div>
    <h3 cngxCardTitle data-testid="bare"><cngx-card-accent-icon />No accent</h3>
  `,
  imports: [CngxCardAccent, CngxCardAccentIcon, CngxCardTitle],
})
class Host {
  readonly severity = signal<CngxCardAccentSeverity>('danger');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const icon = el.querySelector('.cngx-card--accent .cngx-card__accent-icon') as HTMLElement;
  return { fixture, el, icon };
}

describe('CngxCardAccentIcon', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders a decorative glyph and the severity label of the enclosing accent', () => {
    const { icon } = setup();
    const svg = icon.querySelector('svg') as SVGElement;
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('.cngx-sr-only')!.textContent!.trim()).toBe('Critical:');
  });

  it('follows a severity change with a different glyph and label', () => {
    const { fixture, icon } = setup();
    const dangerGlyph = icon.querySelector('svg')!.innerHTML;
    fixture.componentInstance.severity.set('success');
    fixture.detectChanges();
    expect(icon.querySelector('.cngx-sr-only')!.textContent!.trim()).toBe('Success:');
    expect(icon.querySelector('svg')!.innerHTML).not.toBe(dangerGlyph);
  });

  it('renders nothing for neutral, which is no status', () => {
    const { fixture, icon } = setup();
    fixture.componentInstance.severity.set('neutral');
    fixture.detectChanges();
    expect(icon.querySelector('svg')).toBeNull();
    expect(icon.textContent!.trim()).toBe('');
  });

  it('renders nothing outside an accented card', () => {
    const { el } = setup();
    const bare = el.querySelector('[data-testid="bare"] .cngx-card__accent-icon') as HTMLElement;
    expect(bare.querySelector('svg')).toBeNull();
  });

  it('reads the label from the card i18n bundle', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideCardI18n(withCardI18nLabels({ accentDanger: 'Kritisch' }))],
    });
    const { icon } = setup();
    expect(icon.querySelector('.cngx-sr-only')!.textContent!.trim()).toBe('Kritisch:');
  });
});
