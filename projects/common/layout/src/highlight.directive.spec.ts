import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxHighlight } from './highlight.directive';

@Component({
  template: `<p [cngxHighlight]="term()" #hl="cngxHighlight">Angular Signals are powerful signals for Angular apps.</p>`,
  imports: [CngxHighlight],
})
class TestHost {
  readonly term = signal('');
}

describe('CngxHighlight', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const p = fixture.debugElement.query(By.directive(CngxHighlight));
    const dir = p.injector.get(CngxHighlight);
    const host = p.nativeElement as HTMLElement;
    return { fixture, dir, host };
  }

  it('starts with no highlights and matchCount=0', () => {
    const { dir, host } = setup();
    expect(dir.matchCount()).toBe(0);
    expect(host.querySelectorAll('mark').length).toBe(0);
  });

  it('wraps matching text in <mark> elements', () => {
    const { fixture, dir, host } = setup();
    fixture.componentInstance.term.set('Signal');
    TestBed.flushEffects();
    fixture.detectChanges();

    const marks = host.querySelectorAll('mark');
    expect(marks.length).toBe(2); // "Signals" and "signals"
    expect(dir.matchCount()).toBe(2);
  });

  it('is case-insensitive by default', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.term.set('angular');
    TestBed.flushEffects();
    fixture.detectChanges();

    const marks = host.querySelectorAll('mark');
    expect(marks.length).toBe(2); // "Angular" and "Angular"
  });

  it('restores original text when term is cleared', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.term.set('Signal');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(host.querySelectorAll('mark').length).toBeGreaterThan(0);

    fixture.componentInstance.term.set('');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(host.querySelectorAll('mark').length).toBe(0);
    expect(host.textContent).toContain('Angular Signals');
  });

  it('updates highlights when term changes', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.term.set('Angular');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(host.querySelectorAll('mark').length).toBe(2);

    fixture.componentInstance.term.set('powerful');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(host.querySelectorAll('mark').length).toBe(1);
    expect(host.querySelector('mark')!.textContent).toBe('powerful');
  });

  it('handles special regex characters in term', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.term.set('apps.');
    TestBed.flushEffects();
    fixture.detectChanges();

    const marks = host.querySelectorAll('mark');
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe('apps.');
  });
});
