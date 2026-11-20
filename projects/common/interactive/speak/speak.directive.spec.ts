import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideLocale } from '@cngx/core/utils';
import { CngxSpeak } from './speak.directive';

class MockUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}
// Stubbed once at module level on purpose: every test here needs the mock, so it
// must not be unstubbed per test. The shared setup unstubs at file end, which is
// what keeps it out of the next spec file. The per-test speechSynthesis stub is
// re-set in beforeEach and is unaffected.
vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

@Component({
  template: '<div [cngxSpeak]="message()"></div>',
  imports: [CngxSpeak],
})
class TestHost {
  message = signal('');
}

@Component({
  template: '<div [cngxSpeak]="message()" [rate]="rate()"></div>',
  imports: [CngxSpeak],
})
class RateHost {
  message = signal('');
  rate = signal(1);
}

@Component({
  template: '<div [cngxSpeak]="message()" lang="fr-FR"></div>',
  imports: [CngxSpeak],
})
class LangHost {
  message = signal('');
}

@Component({
  template: '<div [cngxSpeak]="message()" [enabled]="enabled()"></div>',
  imports: [CngxSpeak],
})
class EnabledHost {
  message = signal('Hello');
  enabled = signal(true);
}

@Component({
  template: '<div [cngxSpeak]="message()" [rate]="2" [pitch]="0.5" [volume]="0.3"></div>',
  imports: [CngxSpeak],
})
class ParamsHost {
  message = signal('');
}

describe('CngxSpeak', () => {
  let initialLang: string | null;
  beforeEach(() => {
    initialLang = document.documentElement.getAttribute('lang');
    // performSpeak gates cancel() on `synth.speaking || synth.pending` to
    // dodge Chrome's idle-cancel utterance-drop bug. The mock therefore
    // has to track those flags so the "cancels previous speech" contract
    // is observable.
    const synth = {
      speaking: false,
      pending: false,
      speak: vi.fn(),
      cancel: vi.fn(),
    };
    synth.speak.mockImplementation(() => {
      synth.speaking = true;
    });
    synth.cancel.mockImplementation(() => {
      synth.speaking = false;
      synth.pending = false;
    });
    vi.stubGlobal('speechSynthesis', synth);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => {
    if (initialLang === null) {
      document.documentElement.removeAttribute('lang');
    } else {
      document.documentElement.setAttribute('lang', initialLang);
    }
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSpeak));
    const dir = el.injector.get(CngxSpeak);
    return { fixture, dir };
  }

  it('speaks in the app locale while no lang is bound', () => {
    TestBed.configureTestingModule({ providers: [provideLocale('de-AT')] });
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hallo');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('de-AT');
  });

  it('leaves the utterance language to the browser without a locale or <html lang>', () => {
    document.documentElement.removeAttribute('lang');
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hallo');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('');
  });

  it('speaks in <html lang> while no locale is provided', () => {
    document.documentElement.lang = 'de';
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hallo');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('de');
  });

  it('speaks in an explicit LOCALE_ID other than en-US', () => {
    document.documentElement.lang = 'fr';
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'de-CH' }] });
    const { fixture } = setup();
    fixture.componentInstance.message.set('Grüezi');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('de-CH');
  });

  it('reads an en-US LOCALE_ID as unset and speaks in <html lang>', () => {
    document.documentElement.lang = 'de';
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'en-US' }] });
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hallo');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('de');
  });

  it('lets a bound lang win over the app locale', () => {
    document.documentElement.lang = 'de';
    TestBed.configureTestingModule({ providers: [provideLocale('de-AT')] });
    const fixture = TestBed.createComponent(LangHost);
    fixture.detectChanges();
    fixture.componentInstance.message.set('Bonjour');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.lang).toBe('fr-FR');
  });

  it('does not speak on initial render', () => {
    setup();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('speaks when text changes to non-empty value', () => {
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('does not speak when text changes to empty', () => {
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    vi.mocked(speechSynthesis.speak).mockClear();
    fixture.componentInstance.message.set('');
    TestBed.flushEffects();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('cancels previous speech before new one', () => {
    const { fixture } = setup();
    fixture.componentInstance.message.set('First');
    TestBed.flushEffects();
    fixture.componentInstance.message.set('Second');
    TestBed.flushEffects();
    expect(speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('exposes speaking signal', () => {
    const { dir } = setup();
    expect(dir.speaking()).toBe(false);
  });

  it('does not re-speak when only a parameter (rate) changes', () => {
    const fixture = TestBed.createComponent(RateHost);
    fixture.detectChanges();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);

    // rate is a per-utterance parameter, not a re-speak trigger.
    fixture.componentInstance.rate.set(2);
    TestBed.flushEffects();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('destroy cancels only while an own utterance is live', () => {
    const { fixture } = setup();
    // No own utterance in flight: destroy must not clear the global queue
    // (a sibling's speech would die).
    fixture.destroy();
    expect(speechSynthesis.cancel).not.toHaveBeenCalled();
  });

  it('destroy cancels an in-flight own utterance', () => {
    const { fixture } = setup();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    fixture.destroy();
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it('ignores the stale onend of a replaced utterance', () => {
    const { fixture, dir } = setup();
    const speak = speechSynthesis.speak as ReturnType<typeof vi.fn>;
    fixture.componentInstance.message.set('First');
    TestBed.flushEffects();
    const first = speak.mock.calls[0][0] as MockUtterance;
    first.onstart?.();
    expect(dir.speaking()).toBe(true);

    fixture.componentInstance.message.set('Second');
    TestBed.flushEffects();
    const second = speak.mock.calls[1][0] as MockUtterance;
    second.onstart?.();

    // The replaced utterance's late onend must not flip speaking off.
    first.onend?.();
    expect(dir.speaking()).toBe(true);

    second.onend?.();
    expect(dir.speaking()).toBe(false);
  });

  it('reports supported based on speechSynthesis availability', () => {
    const { dir } = setup();
    expect(dir.supported).toBe(true);
  });

  it('does not speak a non-empty mount value', () => {
    const fixture = TestBed.createComponent(EnabledHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();

    fixture.componentInstance.message.set('Changed');
    TestBed.flushEffects();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('does not auto-speak a text change while enabled is false', () => {
    const fixture = TestBed.createComponent(EnabledHost);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    fixture.componentInstance.message.set('Changed');
    TestBed.flushEffects();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('does not re-speak the unchanged text when enabled goes from false to true', () => {
    const fixture = TestBed.createComponent(EnabledHost);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    fixture.componentInstance.message.set('Changed');
    TestBed.flushEffects();
    fixture.componentInstance.enabled.set(true);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('passes rate, pitch and volume to the utterance', () => {
    const fixture = TestBed.createComponent(ParamsHost);
    fixture.detectChanges();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect([utterance.rate, utterance.pitch, utterance.volume]).toEqual([2, 0.5, 0.3]);
  });

  it('cancel() stops an own utterance and is a no-op without one', () => {
    const { fixture, dir } = setup();
    dir.cancel();
    expect(speechSynthesis.cancel).not.toHaveBeenCalled();

    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    utterance.onstart?.();
    dir.cancel();
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(dir.speaking()).toBe(false);
  });

  it('toggle() speaks the bound text when idle and cancels while speaking', () => {
    const fixture = TestBed.createComponent(EnabledHost);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    const dir = fixture.debugElement.query(By.directive(CngxSpeak)).injector.get(CngxSpeak);

    dir.toggle();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    expect(utterance.text).toBe('Hello');
    utterance.onstart?.();

    dir.toggle();
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(dir.speaking()).toBe(false);
  });

  it('toggle() cancels an own utterance that is queued but not started', () => {
    const fixture = TestBed.createComponent(EnabledHost);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    const dir = fixture.debugElement.query(By.directive(CngxSpeak)).injector.get(CngxSpeak);

    dir.toggle();
    expect(dir.speaking()).toBe(false);
    dir.toggle();
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it('cancels its own utterance when the text becomes empty', () => {
    const { fixture, dir } = setup();
    fixture.componentInstance.message.set('Hello');
    TestBed.flushEffects();
    const utterance = vi.mocked(speechSynthesis.speak).mock.calls[0][0] as unknown as MockUtterance;
    utterance.onstart?.();

    fixture.componentInstance.message.set('');
    TestBed.flushEffects();
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);

    // The engine reports the cancelled utterance as interrupted; that
    // callback, not the text effect, ends speaking.
    utterance.onerror?.();
    expect(dir.speaking()).toBe(false);

    fixture.componentInstance.message.set('Again');
    TestBed.flushEffects();
    const next = vi.mocked(speechSynthesis.speak).mock.calls[1][0] as unknown as MockUtterance;
    next.onstart?.();
    utterance.onend?.();
    expect(dir.speaking()).toBe(true);
  });

  it('reads speaking() before the text input is bound without throwing', () => {
    @Component({
      template: '<div [class.on]="tts.speaking()" [cngxSpeak]="\'Hi\'" #tts="cngxSpeak"></div>',
      imports: [CngxSpeak],
    })
    class SelfReadHost {}
    const fixture = TestBed.createComponent(SelfReadHost);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
