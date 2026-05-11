import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import {
  CNGX_OPTION_FILTER_HOST,
  type CngxOptionFilterHost,
} from './option-filter-host';
import { CngxOption } from './option.directive';

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0">
      <div cngxOption value="a" label="Apple">Apple</div>
      <div cngxOption value="b" label="Banana">Banana</div>
      <div cngxOption value="c" label="Cherry">Cherry</div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption],
  providers: [{ provide: CNGX_OPTION_FILTER_HOST, useExisting: FilterHostHarness }],
})
class FilterHostHarness implements CngxOptionFilterHost {
  readonly searchTerm = signal<string>('');

  matches<T>(_value: T, label: string, term: string): boolean {
    return label.toLowerCase().includes(term.toLowerCase());
  }
}

function setup(): {
  fixture: ComponentFixture<FilterHostHarness>;
  host: FilterHostHarness;
  optionEls: { el: HTMLElement; opt: CngxOption }[];
} {
  TestBed.configureTestingModule({});
  const fixture = TestBed.createComponent(FilterHostHarness);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    optionEls: fixture.debugElement
      .queryAll(By.directive(CngxOption))
      .map((d) => ({ el: d.nativeElement as HTMLElement, opt: d.injector.get(CngxOption) })),
  };
}

describe('CNGX_OPTION_FILTER_HOST', () => {
  it('all options visible when no filter host is provided', () => {
    @Component({
      template: `<div cngxActiveDescendant tabindex="0">
        <div cngxOption value="a" label="Apple">Apple</div>
      </div>`,
      imports: [CngxActiveDescendant, CngxOption],
    })
    class HostlessHost {}

    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostlessHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const optEl = fixture.debugElement.query(By.directive(CngxOption));
    expect(optEl.injector.get(CngxOption).hidden()).toBe(false);
    expect((optEl.nativeElement as HTMLElement).hasAttribute('hidden')).toBe(false);
  });

  it('all options visible when search term is empty', () => {
    const { optionEls } = setup();
    optionEls.forEach(({ el, opt }) => {
      expect(opt.hidden()).toBe(false);
      expect(el.hasAttribute('hidden')).toBe(false);
      expect(el.classList.contains('cngx-option--hidden')).toBe(false);
    });
  });

  it('non-matching options carry [hidden] AND .cngx-option--hidden when filter rejects them', () => {
    const { fixture, host, optionEls } = setup();

    host.searchTerm.set('an');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(optionEls[0].opt.hidden()).toBe(true);
    expect(optionEls[1].opt.hidden()).toBe(false);
    expect(optionEls[2].opt.hidden()).toBe(true);

    expect(optionEls[0].el.hasAttribute('hidden')).toBe(true);
    expect(optionEls[0].el.classList.contains('cngx-option--hidden')).toBe(true);
    expect(optionEls[1].el.hasAttribute('hidden')).toBe(false);
    expect(optionEls[1].el.classList.contains('cngx-option--hidden')).toBe(false);
  });

  it('clearing the term restores visibility for previously hidden options', () => {
    const { fixture, host, optionEls } = setup();

    host.searchTerm.set('an');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(optionEls[0].opt.hidden()).toBe(true);

    host.searchTerm.set('');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(optionEls[0].opt.hidden()).toBe(false);
    expect(optionEls[0].el.hasAttribute('hidden')).toBe(false);
  });
});
