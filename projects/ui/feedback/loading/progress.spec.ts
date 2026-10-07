import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocale } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { provideFeedbackI18n } from '../config/feedback-i18n';
import { CngxProgress } from './progress';

@Component({
  imports: [CngxProgress],
  template: `<cngx-progress [progress]="progress()" [showLabel]="true" />`,
})
class ProgressHost {
  readonly progress = signal<number | undefined>(42);
}

const percent = (locale: string, value: number): string =>
  new Intl.NumberFormat(locale, { style: 'percent' }).format(value);

const render = () => {
  const fixture = TestBed.createComponent(ProgressHost);
  fixture.detectChanges();
  const host = (fixture.nativeElement as HTMLElement).querySelector('cngx-progress')!;
  return {
    fixture,
    host,
    valueText: () => {
      const text = host.getAttribute('aria-valuetext');
      return text === null ? null : stripBidiIsolates(text);
    },
    visible: () => host.querySelector('.cngx-progress__label')?.textContent?.trim(),
  };
};

describe('CngxProgress i18n and locale', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('names itself and formats the percent in English by default', () => {
    const { host, valueText, visible } = render();
    expect(host.getAttribute('aria-label')).toBe('Progress');
    expect(valueText()).toBe('42%');
    expect(visible()).toBe('42%');
  });

  it('formats de-DE through provideLocale', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('de-DE')] });
    const { valueText, visible } = render();
    expect(valueText()).toBe(percent('de-DE', 0.42));
    expect(visible()).toBe(percent('de-DE', 0.42));
  });

  it('formats de-DE through LOCALE_ID without a CNGX_LOCALE provider', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'de-DE' }] });
    const { valueText } = render();
    expect(valueText()).toBe(percent('de-DE', 0.42));
  });

  it('re-formats the valuetext on a locale Signal flip', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({ providers: [provideLocale(locale)] });
    const { fixture, valueText } = render();
    expect(valueText()).toBe('42%');
    locale.set('de-DE');
    fixture.detectChanges();
    expect(valueText()).toBe(percent('de-DE', 0.42));
  });

  it('routes label and valuetext through the feedback i18n bundle', () => {
    TestBed.configureTestingModule({
      providers: [
        provideFeedbackI18n({
          progressLabel: 'Fortschritt',
          progressValueText: (p, formatted) => `${formatted} erledigt (${p})`,
        }),
      ],
    });
    const { host, valueText } = render();
    expect(host.getAttribute('aria-label')).toBe('Fortschritt');
    expect(valueText()).toBe('42% erledigt (42)');
  });

  it('drops the valuetext in indeterminate mode', () => {
    const { fixture, valueText } = render();
    fixture.componentInstance.progress.set(undefined);
    fixture.detectChanges();
    expect(valueText()).toBeNull();
  });
});
