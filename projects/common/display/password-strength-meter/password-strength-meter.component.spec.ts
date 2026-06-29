import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxPasswordStrengthMeter } from './password-strength-meter.component';

@Component({
  template: `<cngx-password-strength-meter [score]="score()" />`,
  imports: [CngxPasswordStrengthMeter],
})
class Host {
  readonly score = signal(0);
}

function setup(initial = 0) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.score.set(initial);
  fixture.detectChanges();
  const host = fixture.nativeElement.querySelector(
    'cngx-password-strength-meter',
  ) as HTMLElement;
  const segments = () =>
    Array.from(host.querySelectorAll<HTMLElement>('.cngx-password-strength-meter__segment'));
  return { fixture, host, segments };
}

describe('CngxPasswordStrengthMeter', () => {
  it('always renders four segments', () => {
    const { segments } = setup(0);
    expect(segments()).toHaveLength(4);
  });

  it('fills the first N segments for score N', () => {
    const { segments } = setup(3);
    const filled = segments().map((s) => s.getAttribute('data-filled'));
    expect(filled).toEqual(['true', 'true', 'true', 'false']);
  });

  it('fills all segments at score 4 and none at score 0', () => {
    const { fixture, segments } = setup(4);
    expect(segments().every((s) => s.getAttribute('data-filled') === 'true')).toBe(true);
    fixture.componentInstance.score.set(0);
    fixture.detectChanges();
    expect(segments().every((s) => s.getAttribute('data-filled') === 'false')).toBe(true);
  });

  it('clamps an out-of-range score into 0..4', () => {
    const { fixture, segments } = setup(9);
    expect(segments().every((s) => s.getAttribute('data-filled') === 'true')).toBe(true);
    fixture.componentInstance.score.set(-3);
    fixture.detectChanges();
    expect(segments().every((s) => s.getAttribute('data-filled') === 'false')).toBe(true);
  });

  it('exposes the strength level via data-strength', () => {
    const { fixture, host } = setup(2);
    expect(host.getAttribute('data-strength')).toBe('fair');
    fixture.componentInstance.score.set(4);
    fixture.detectChanges();
    expect(host.getAttribute('data-strength')).toBe('strong');
  });

  it('is aria-hidden so it never double-announces', () => {
    const { host } = setup(2);
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });
});
