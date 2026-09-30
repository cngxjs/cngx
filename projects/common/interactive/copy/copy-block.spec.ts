import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { provideInteractiveI18n, withInteractiveI18nLabels } from '../i18n/interactive-i18n';
import { CngxCopyBlock } from './copy-block';
import { CngxCopyText } from './copy-text.directive';

@Component({
  template: `<cngx-copy-block [value]="'npm i'" [buttonLabel]="buttonLabel()">npm i</cngx-copy-block>`,
  imports: [CngxCopyBlock],
})
class Host {
  readonly buttonLabel = signal<string | undefined>(undefined);
}

const lang = signal<'en' | 'de'>('en');

describe('CngxCopyBlock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    lang.set('en');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels(
            computed(() =>
              lang() === 'de'
                ? { copy: 'Kopieren', copied: 'Kopiert!', copiedAnnouncement: 'In die Zwischenablage kopiert' }
                : {},
            ),
          ),
        ),
      ],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const copyText = fixture.debugElement.query(By.directive(CngxCopyText)).injector.get(CngxCopyText);
    return {
      fixture,
      copyText,
      button: () => root.querySelector('button')!.textContent!.trim(),
      live: () => root.querySelector('[aria-live="polite"]')!.textContent!.trim(),
    };
  }

  it('renders the button label from the bundle and follows a language flip', () => {
    const { fixture, button } = setup();
    expect(button()).toBe('Copy');

    lang.set('de');
    fixture.detectChanges();
    expect(button()).toBe('Kopieren');
  });

  it('lets a bound buttonLabel win over the bundle', () => {
    const { fixture, button } = setup();
    fixture.componentInstance.buttonLabel.set('Copy command');
    fixture.detectChanges();
    expect(button()).toBe('Copy command');
  });

  it('does not re-announce on a language flip', async () => {
    const { fixture, copyText, live, button } = setup();
    expect(live()).toBe('');

    await copyText.copy();
    fixture.detectChanges();
    expect(live()).toBe('Copied to clipboard');

    lang.set('de');
    fixture.detectChanges();
    expect(live()).toBe('Copied to clipboard');
    expect(button()).toBe('Kopiert!');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(live()).toBe('');

    await copyText.copy();
    fixture.detectChanges();
    expect(live()).toBe('In die Zwischenablage kopiert');
  });
});
