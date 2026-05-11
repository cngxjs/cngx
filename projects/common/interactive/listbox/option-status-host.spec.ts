import {
  Component,
  computed,
  signal,
  TemplateRef,
  ViewChild,
  type Signal,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CngxOption } from './option.directive';
import {
  CNGX_OPTION_STATUS_HOST,
  type CngxOptionStatus,
  type CngxOptionStatusHost,
} from './option-status-host';

@Component({
  template: `
    <ng-template #pendingTpl><span data-glyph="pending">P</span></ng-template>
    <ng-template #errorTpl><span data-glyph="error">E</span></ng-template>

    <div cngxActiveDescendant tabindex="0">
      <div cngxOption value="a">A</div>
      <div cngxOption value="b">B</div>
      <div cngxOption value="c">C</div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption],
  providers: [{ provide: CNGX_OPTION_STATUS_HOST, useExisting: WiredHost }],
})
class WiredHost implements CngxOptionStatusHost {
  @ViewChild('pendingTpl', { static: true }) pendingTpl!: TemplateRef<unknown>;
  @ViewChild('errorTpl', { static: true }) errorTpl!: TemplateRef<unknown>;

  readonly target = signal<{ value: string; kind: CngxOptionStatus['kind'] } | null>(null);

  statusFor<T>(value: T): Signal<CngxOptionStatus | null> {
    return computed(() => {
      const t = this.target();
      if (!t || t.value !== (value as unknown as string)) {
        return null;
      }
      return {
        kind: t.kind,
        tpl: t.kind === 'pending' ? this.pendingTpl : this.errorTpl,
      };
    });
  }
}

@Component({
  template: `
    <div cngxActiveDescendant tabindex="0">
      <div cngxOption value="a">A</div>
    </div>
  `,
  imports: [CngxActiveDescendant, CngxOption],
})
class HostlessHost {}

function setupWired(): {
  fixture: ComponentFixture<WiredHost>;
  host: WiredHost;
  optionEls: { el: HTMLElement; opt: CngxOption }[];
} {
  const fixture = TestBed.createComponent(WiredHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return {
    fixture,
    host: fixture.componentInstance,
    optionEls: byOption(fixture),
  };
}

function byOption(fixture: ComponentFixture<unknown>): { el: HTMLElement; opt: CngxOption }[] {
  return fixture.debugElement
    .queryAll(By.directive(CngxOption))
    .map((d) => ({ el: d.nativeElement as HTMLElement, opt: d.injector.get(CngxOption) }));
}

describe('CNGX_OPTION_STATUS_HOST', () => {
  it('option without status host has null statusSignal and no data-status', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(HostlessHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const optEl = fixture.debugElement.query(By.directive(CngxOption));
    const opt = optEl.injector.get(CngxOption);
    expect(opt.statusSignal()).toBeNull();
    expect((optEl.nativeElement as HTMLElement).getAttribute('data-status')).toBeNull();
  });

  it('only the targeted option carries data-status when host returns pending', () => {
    TestBed.configureTestingModule({});
    const { fixture, host, optionEls } = setupWired();

    host.target.set({ value: 'a', kind: 'pending' });
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(optionEls[0].opt.statusSignal()?.kind).toBe('pending');
    expect(optionEls[1].opt.statusSignal()).toBeNull();
    expect(optionEls[2].opt.statusSignal()).toBeNull();

    expect(optionEls[0].el.getAttribute('data-status')).toBe('pending');
    expect(optionEls[1].el.getAttribute('data-status')).toBeNull();
    expect(optionEls[2].el.getAttribute('data-status')).toBeNull();
  });

  it('flipping kind from pending to error updates data-status reactively without re-creating the host', () => {
    TestBed.configureTestingModule({});
    const { fixture, host, optionEls } = setupWired();

    const targetEl = optionEls[1].el;
    host.target.set({ value: 'b', kind: 'pending' });
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(targetEl.getAttribute('data-status')).toBe('pending');
    const beforeFlip = optionEls[1].el;

    host.target.set({ value: 'b', kind: 'error' });
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(targetEl.getAttribute('data-status')).toBe('error');

    // Same DOM node — host element wasn't re-created.
    expect(byOption(fixture)[1].el).toBe(beforeFlip);
  });

  it('statusSignal equal predicate prevents emission when kind+tpl unchanged', () => {
    TestBed.configureTestingModule({});
    const { fixture, host, optionEls } = setupWired();

    let emissionCount = 0;
    const stop = (() => {
      const inj = optionEls[0].opt;
      // Read once to cache.
      void inj.statusSignal();
      // Compose a manual computed counter.
      const counter = computed(() => {
        void inj.statusSignal();
        emissionCount++;
        return emissionCount;
      });
      void counter();
      return () => undefined;
    })();

    host.target.set({ value: 'a', kind: 'pending' });
    TestBed.flushEffects();
    fixture.detectChanges();
    const afterFirstSet = emissionCount;

    // Same target — same kind, same tpl. Equal predicate should suppress.
    host.target.set({ value: 'a', kind: 'pending' });
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(emissionCount).toBe(afterFirstSet);

    stop();
  });
});
