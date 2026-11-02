import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AsyncView } from '@cngx/common/data';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import type { CngxActiveLanguagePack } from '@cngx/core/i18n';
import { stripBidiIsolates } from '@cngx/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxSelectAnnouncer } from './announcer';
import { resolveSelectConfig } from './internal/resolve-config';
import {
  CNGX_SEARCH_EFFECTS_FACTORY,
  createSearchEffects,
  searchResultsFrom,
} from './search-effects';

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

@Component({ selector: 'results-probe', template: '', standalone: true })
class ResultsProbe {
  readonly searchTerm: WritableSignal<string> = signal('');
  readonly panelOpen = signal(true);
  // Disabled so auto-open never runs; the announcement does not depend on it.
  readonly disabled = signal(true);
  readonly count = signal(3);
  readonly view = signal<AsyncView>('content');
  readonly refreshing = signal(false);
  readonly config = resolveSelectConfig();

  constructor() {
    createSearchEffects({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => undefined,
      results: searchResultsFrom({
        count: () => this.count(),
        activeView: this.view,
        refreshing: this.refreshing,
        ariaLabels: this.config.ariaLabels,
      }),
    });
  }
}

describe('createSearchEffects - filter outcome announcement', () => {
  let c: ResultsProbe;
  let spoken: { message: string; politeness: string }[];
  const pack = signal<CngxActiveLanguagePack | undefined>(undefined);

  beforeEach(() => {
    spoken = [];
    pack.set(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
        {
          provide: CngxSelectAnnouncer,
          useValue: {
            announce: (message: string, politeness = 'polite') =>
              spoken.push({ message, politeness }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ResultsProbe);
    c = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.flushEffects();
  });

  const messages = (): string[] => spoken.map((s) => stripBidiIsolates(s.message));

  it('stays silent for the empty term', () => {
    expect(spoken).toEqual([]);
  });

  it('speaks the plural count politely once the term settles', () => {
    c.searchTerm.set('re');
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results']);
    expect(spoken[0].politeness).toBe('polite');

    c.count.set(1);
    c.searchTerm.set('red');
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results', '1 result']);
  });

  it('speaks no results when nothing matches', () => {
    c.count.set(0);
    c.view.set('empty');
    c.searchTerm.set('zzz');
    TestBed.flushEffects();
    expect(messages()).toEqual(['No results']);
  });

  it('waits until loading and refreshing are over', () => {
    c.view.set('skeleton');
    c.searchTerm.set('re');
    TestBed.flushEffects();
    expect(spoken).toEqual([]);

    c.view.set('content');
    c.refreshing.set(true);
    TestBed.flushEffects();
    expect(spoken).toEqual([]);

    c.count.set(2);
    c.refreshing.set(false);
    TestBed.flushEffects();
    expect(messages()).toEqual(['2 results']);
  });

  it('stays silent while the panel is closed and speaks when it opens', () => {
    c.panelOpen.set(false);
    c.searchTerm.set('re');
    TestBed.flushEffects();
    expect(spoken).toEqual([]);

    c.panelOpen.set(true);
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results']);
  });

  it('speaks a term and count pair once, and again after the term was cleared', () => {
    c.searchTerm.set('re');
    TestBed.flushEffects();
    c.panelOpen.set(false);
    TestBed.flushEffects();
    c.panelOpen.set(true);
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results']);

    c.searchTerm.set('');
    TestBed.flushEffects();
    c.searchTerm.set('re');
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results', '3 results']);
  });

  it('reads the active pack without re-speaking on a language switch', () => {
    c.searchTerm.set('ro');
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results']);

    pack.set({
      locale: 'de',
      select: { announceResults: { one: '{count} Ergebnis', other: '{count} Ergebnisse' } },
    });
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results']);

    c.count.set(1200);
    TestBed.flushEffects();
    expect(messages()).toEqual(['3 results', '1.200 Ergebnisse']);
  });
});
