import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxDgaCount } from './data-grid-count.directive';

@Component({
  template: `<span [cngxDgaCount]="count()"></span>`,
  imports: [CngxDgaCount],
})
class Host {
  readonly count = signal(0);
}

describe('CngxDgaCount', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDgaCount));
    return { fixture, host: fixture.componentInstance, el: de.nativeElement as HTMLElement };
  }

  it('is a polite, atomic status live region', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('renders the count with a pluralised noun and updates reactively', () => {
    const { fixture, host, el } = setup();
    expect(el.textContent).toBe('0 results');

    host.count.set(1);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.textContent).toBe('1 result');

    host.count.set(7);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(el.textContent).toBe('7 results');
  });
});
