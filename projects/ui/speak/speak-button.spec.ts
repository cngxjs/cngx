import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { type CngxSpeak } from '@cngx/common';

import { CngxSpeakButton } from './speak-button';

interface SpeakMock {
  ref: CngxSpeak;
  readonly speaking: ReturnType<typeof signal<boolean>>;
  toggleCalls: number;
}

function makeSpeak(speaking = false, supported = true): SpeakMock {
  const s = signal(speaking);
  const mock: SpeakMock = { speaking: s, toggleCalls: 0, ref: null as unknown as CngxSpeak };
  mock.ref = {
    speaking: () => s(),
    supported,
    toggle: () => {
      mock.toggleCalls++;
    },
  } as unknown as CngxSpeak;
  return mock;
}

function setup(speak: SpeakMock) {
  const fixture = TestBed.createComponent(CngxSpeakButton);
  fixture.componentRef.setInput('speakRef', speak.ref);
  fixture.detectChanges();
  const host = fixture.nativeElement as HTMLElement;
  const button = host.querySelector('button') as HTMLButtonElement;
  return { fixture, host, button };
}

describe('CngxSpeakButton', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CngxSpeakButton] });
  });

  it('reads aloud label and speaker icon while idle', () => {
    const speak = makeSpeak(false);
    const { host, button } = setup(speak);
    expect(button.getAttribute('aria-label')).toBe('Read aloud');
    expect(host.classList.contains('cngx-speak-button--speaking')).toBe(false);
    // Idle icon is the outlined speaker (path), not the stop square (rect).
    expect(host.querySelector('svg rect')).toBeNull();
    expect(host.querySelector('svg path')).toBeTruthy();
  });

  it('toggles label, host class and icon to the speaking state', () => {
    const speak = makeSpeak(false);
    const { fixture, host, button } = setup(speak);
    speak.speaking.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Stop speaking');
    expect(host.classList.contains('cngx-speak-button--speaking')).toBe(true);
    expect(host.querySelector('svg rect')).toBeTruthy();
  });

  it('calls speakRef.toggle() on click', () => {
    const speak = makeSpeak(false);
    const { button } = setup(speak);
    button.click();
    expect(speak.toggleCalls).toBe(1);
  });

  it('honours the label inputs as the accessible name in both states', () => {
    const speak = makeSpeak(false);
    const fixture = TestBed.createComponent(CngxSpeakButton);
    fixture.componentRef.setInput('speakRef', speak.ref);
    fixture.componentRef.setInput('readAloudLabel', 'Vorlesen');
    fixture.componentRef.setInput('stopLabel', 'Stoppen');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Vorlesen');
    speak.speaking.set(true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Stoppen');
  });

  it('stays visible when speech synthesis is supported', () => {
    const speak = makeSpeak(false, true);
    const { host } = setup(speak);
    expect(host.hasAttribute('hidden')).toBe(false);
  });

  it('hides itself when speech synthesis is unsupported', () => {
    const speak = makeSpeak(false, false);
    const { host } = setup(speak);
    expect(host.hasAttribute('hidden')).toBe(true);
  });
});
