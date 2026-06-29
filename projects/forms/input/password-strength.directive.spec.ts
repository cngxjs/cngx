import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxPasswordStrength } from './password-strength.directive';
import {
  CNGX_PASSWORD_STRENGTH_FACTORY,
  type CngxPasswordStrengthFactory,
} from './password-strength.factory';
import { provideInputConfig, withInputAriaLabels } from './input-config';

@Component({
  template: `<input cngxPasswordStrength #pw="cngxPasswordStrength" type="password" />`,
  imports: [CngxPasswordStrength],
})
class Host {
  readonly directive = viewChild.required(CngxPasswordStrength);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, input, directive };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  TestBed.flushEffects();
}

describe('CngxPasswordStrength', () => {
  it('derives a low score for a short single-class password', () => {
    const { input, directive } = setup();
    type(input, 'abc');
    expect(directive.score()).toBe(0);
    expect(directive.label()).toBe('weak');
  });

  it('derives a high score for a long, diverse password', () => {
    const { input, directive } = setup();
    type(input, 'Abcdef1!Ghijkl2?');
    expect(directive.score()).toBe(4);
    expect(directive.label()).toBe('strong');
  });

  it('keeps the strength reference stable when score and label are unchanged', () => {
    const { input, directive } = setup();
    type(input, 'abcdefgh');
    const first = directive.strength();
    type(input, 'abcdefghi');
    expect(directive.strength()).toBe(first);
  });

  it('uses an overridden CNGX_PASSWORD_STRENGTH_FACTORY', () => {
    const override: CngxPasswordStrengthFactory = () => ({ score: 2, label: 'fair' });
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_PASSWORD_STRENGTH_FACTORY, useValue: override }],
    });
    const { input, directive } = setup();
    type(input, 'anything');
    expect(directive.score()).toBe(2);
    expect(directive.label()).toBe('fair');
  });

  describe('debounced announcement', () => {
    afterEach(() => vi.useRealTimers());

    it('announces the label once after the debounce window', () => {
      vi.useFakeTimers();
      const announcer = TestBed.inject(CngxLiveAnnouncer);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
      const { input } = setup();
      type(input, 'Abcdef1!Ghijkl2?');
      expect(announce).not.toHaveBeenCalled();
      vi.advanceTimersByTime(400);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Password strength: strong');
    });

    it('does not announce while the field is empty', () => {
      vi.useFakeTimers();
      const announcer = TestBed.inject(CngxLiveAnnouncer);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
      setup();
      vi.advanceTimersByTime(1000);
      expect(announce).not.toHaveBeenCalled();
    });

    it('announces through the configured template override', () => {
      TestBed.configureTestingModule({
        providers: [
          provideInputConfig(
            withInputAriaLabels({ passwordStrength: (label) => `Stärke: ${label}` }),
          ),
        ],
      });
      vi.useFakeTimers();
      const announcer = TestBed.inject(CngxLiveAnnouncer);
      const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
      const { input } = setup();
      type(input, 'Abcdef1!Ghijkl2?');
      vi.advanceTimersByTime(400);
      expect(announce).toHaveBeenCalledWith('Stärke: strong');
    });
  });
});
