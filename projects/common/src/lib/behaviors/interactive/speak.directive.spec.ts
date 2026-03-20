import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

@Component({
  template: '<div [cngxSpeak]="message()"></div>',
  imports: [CngxSpeak],
})
class TestHost {
  message = signal('');
}

describe('CngxSpeak', () => {
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn() });
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSpeak));
    const dir = el.injector.get(CngxSpeak);
    return { fixture, dir };
  }

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

  it('reports supported based on speechSynthesis availability', () => {
    const { dir } = setup();
    expect(dir.supported()).toBe(true);
  });
});
