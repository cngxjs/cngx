import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_SEARCH_EFFECTS_FACTORY, createSearchEffects } from './search-effects';

@Component({ selector: 'auto-open-probe', template: '', standalone: true })
class AutoOpenProbe {
  readonly searchTerm: WritableSignal<string> = signal('');
  readonly panelOpen = signal(false);
  readonly disabled = signal(false);
  readonly gate = signal(true);
  readonly openLog: number[] = [];

  constructor() {
    createSearchEffects({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => this.openLog.push(1),
      autoOpenGate: () => this.gate(),
    });
  }
}

@Component({ selector: 'emit-probe', template: '', standalone: true })
class EmitProbe {
  readonly searchTerm: WritableSignal<string> = signal('');
  // Disabled so the auto-open effect never fires - isolates the emit path.
  readonly panelOpen = signal(false);
  readonly disabled = signal(true);
  readonly hasEmittedInitial = signal(false);
  readonly skipInitial = signal(true);
  readonly emitLog: string[] = [];

  constructor() {
    createSearchEffects({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => undefined,
      emit: {
        hasEmittedInitial: this.hasEmittedInitial,
        skipInitial: this.skipInitial,
        onEmit: (term) => this.emitLog.push(term),
      },
    });
  }
}

describe('createSearchEffects - auto-open', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AutoOpenProbe>>;
  let c: AutoOpenProbe;

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoOpenProbe);
    c = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
    c.openLog.length = 0;
  });

  it('opens the panel when a non-empty term is typed while closed and enabled', () => {
    c.searchTerm.set('a');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([1]);
  });

  it('does not open when the panel is already open', () => {
    c.panelOpen.set(true);
    c.searchTerm.set('a');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([]);
  });

  it('does not open when disabled', () => {
    c.disabled.set(true);
    c.searchTerm.set('a');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([]);
  });

  it('does not open for an empty term', () => {
    c.searchTerm.set('');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([]);
  });

  it('respects the autoOpenGate', () => {
    c.gate.set(false);
    c.searchTerm.set('a');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([]);

    c.gate.set(true);
    c.searchTerm.set('ab');
    TestBed.flushEffects();
    expect(c.openLog).toEqual([1]);
  });
});

describe('createSearchEffects - searchTermChange forward', () => {
  it('skips the initial emission when skipInitial is set, then forwards later terms', () => {
    const fixture = TestBed.createComponent(EmitProbe);
    const c = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
    // Initial term consumed and skipped.
    expect(c.emitLog).toEqual([]);
    expect(c.hasEmittedInitial()).toBe(true);

    c.searchTerm.set('a');
    TestBed.flushEffects();
    expect(c.emitLog).toEqual(['a']);
  });

  it('forwards the initial emission when skipInitial is false', () => {
    const fixture = TestBed.createComponent(EmitProbe);
    const c = fixture.componentInstance;
    c.skipInitial.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(c.emitLog).toEqual(['']);
  });
});

describe('CNGX_SEARCH_EFFECTS_FACTORY', () => {
  it('defaults to createSearchEffects', () => {
    expect(TestBed.inject(CNGX_SEARCH_EFFECTS_FACTORY)).toBe(createSearchEffects);
  });
});
