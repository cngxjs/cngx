import { Component, Directive, model, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import {
  provideSelectConfig,
  withAriaLabels,
  withFallbackLabels,
  type CngxSelectFallbackLabels,
} from '../shared/config';
import { CngxSelectSearch } from './select-search.component';
import { CNGX_SELECT_SHELL_SEARCH_HOST } from './select-search-host';

@Directive({
  selector: '[fakeSearchHost]',
  standalone: true,
  providers: [
    { provide: CNGX_SELECT_SHELL_SEARCH_HOST, useExisting: FakeSearchHostDir },
  ],
})
class FakeSearchHostDir {
  readonly searchTerm = model<string>('');
  readonly listboxRef = signal(undefined);
  close(): void {
    /* no-op */
  }
  focus(): void {
    /* no-op */
  }
}

@Component({
  template: `
    <div fakeSearchHost>
      <cngx-select-search [placeholder]="ph" />
    </div>
  `,
  imports: [CngxSelectSearch, FakeSearchHostDir],
})
class HostNoLabel {
  ph = 'Filter…';
}

@Component({
  template: `
    <div fakeSearchHost>
      <cngx-select-search [placeholder]="ph" [aria-label]="lbl" />
    </div>
  `,
  imports: [CngxSelectSearch, FakeSearchHostDir],
})
class HostInstanceLabel {
  ph = 'Filter…';
  lbl = 'Override';
}

function setup<T>(component: new () => T): { input: HTMLInputElement } {
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const input = fixture.debugElement.query(By.css('input[type=search]'))
    .nativeElement as HTMLInputElement;
  return { input };
}

describe('CngxSelectSearch - aria-label cascade', () => {
  it('falls back to the library default English when neither instance nor config sets a label', () => {
    const { input } = setup(HostNoLabel);
    expect(input.getAttribute('aria-label')).toBe('Search options');
  });

  it('per-instance [aria-label] wins over the config default', () => {
    const { input } = setup(HostInstanceLabel);
    expect(input.getAttribute('aria-label')).toBe('Override');
  });

  it('config override via withAriaLabels({ searchInput }) applies when no instance value is set', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSelectConfig(withAriaLabels({ searchInput: 'Find an option' })),
      ],
    });
    const { input } = setup(HostNoLabel);
    expect(input.getAttribute('aria-label')).toBe('Find an option');
  });
});

@Component({
  template: `
    <div fakeSearchHost>
      <cngx-select-search />
    </div>
  `,
  imports: [CngxSelectSearch, FakeSearchHostDir],
})
class HostUnbound {}

describe('CngxSelectSearch - placeholder cascade', () => {
  it('defaults to the library English placeholder', () => {
    const { input } = setup(HostUnbound);
    expect(input.placeholder).toBe('Search…');
  });

  it('reads withFallbackLabels({ searchPlaceholder }) when unbound', () => {
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withFallbackLabels({ searchPlaceholder: 'Suchen…' }))],
    });
    const { input } = setup(HostUnbound);
    expect(input.placeholder).toBe('Suchen…');
  });

  it('follows a Signal of fallbackLabels while unbound', () => {
    const labels = signal<CngxSelectFallbackLabels>({ searchPlaceholder: 'Search…' });
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withFallbackLabels(labels))],
    });
    const fixture = TestBed.createComponent(HostUnbound);
    fixture.detectChanges();
    labels.set({ searchPlaceholder: 'Suchen…' });
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input[type=search]'))
      .nativeElement as HTMLInputElement;
    expect(input.placeholder).toBe('Suchen…');
  });

  it('lets a bound [placeholder] win over the config', () => {
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withFallbackLabels({ searchPlaceholder: 'Suchen…' }))],
    });
    const { input } = setup(HostNoLabel);
    expect(input.placeholder).toBe('Filter…');
  });
});

@Component({
  template: `<cngx-select-search />`,
  imports: [CngxSelectSearch],
})
class OrphanSearchHost {}

describe('CngxSelectSearch placement (CNGX2018)', () => {
  it('throws CNGX2018 outside a select shell', () => {
    expect(() => TestBed.createComponent(OrphanSearchHost).detectChanges()).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX2018',
        message: expect.stringMatching(
          /^CNGX2018: \[cngx-select-search\] must be placed inside <cngx-select-shell>\./,
        ),
      }),
    );
  });

  it('renders inside a search host and writes the typed term into it', () => {
    const fixture = TestBed.createComponent(HostNoLabel);
    fixture.detectChanges();
    const host = fixture.debugElement
      .query(By.directive(FakeSearchHostDir))
      .injector.get(FakeSearchHostDir);
    const input = fixture.debugElement.query(By.css('input[type=search]'))
      .nativeElement as HTMLInputElement;
    input.value = 'gr';
    input.dispatchEvent(new Event('input'));
    expect(host.searchTerm()).toBe('gr');
  });
});

@Directive({
  selector: '[debouncedSearchHost]',
  standalone: true,
  providers: [
    { provide: CNGX_SELECT_SHELL_SEARCH_HOST, useExisting: DebouncedSearchHostDir },
  ],
})
class DebouncedSearchHostDir {
  readonly searchTerm = model<string>('');
  readonly searchDebounceMs = signal(300);
  readonly panelOpen = signal(true);
  readonly writes: string[] = [];
  readonly termAtActivate: string[] = [];
  readonly close = vi.fn();
  readonly focus = vi.fn();
  readonly listboxRef = signal({
    ad: {
      highlightNext: vi.fn(),
      highlightPrev: vi.fn(),
      activateCurrent: () => this.termAtActivate.push(this.searchTerm()),
    },
  } as never);

  constructor() {
    this.searchTerm.subscribe((term) => this.writes.push(term));
  }
}

@Component({
  template: `
    <div debouncedSearchHost>
      <cngx-select-search />
    </div>
  `,
  imports: [CngxSelectSearch, DebouncedSearchHostDir],
})
class HostDebounced {}

describe('CngxSelectSearch - pending debounced write on Escape and Enter', () => {
  function mountDebounced() {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HostDebounced);
    fixture.detectChanges();
    const host = fixture.debugElement
      .query(By.directive(DebouncedSearchHostDir))
      .injector.get(DebouncedSearchHostDir);
    const input = fixture.debugElement.query(By.css('input[type=search]'))
      .nativeElement as HTMLInputElement;
    const type = (term: string) => {
      input.value = term;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const press = (key: string) =>
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    return { fixture, host, input, type, press };
  }

  it('writes the term once after the debounce window without a key', () => {
    const { host, type } = mountDebounced();
    type('ber');
    expect(host.writes).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(host.writes).toEqual(['ber']);
  });

  it('Escape drops the pending write: nothing lands after the debounce window', () => {
    const { host, input, type, press } = mountDebounced();
    type('ber');
    press('Escape');
    expect(host.close).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(host.writes).toEqual([]);
    expect(host.searchTerm()).toBe('');
    expect(input.value).toBe('');
  });

  it('Enter writes the pending term, activates after the next render, and writes nothing later', () => {
    const { fixture, host, type, press } = mountDebounced();
    type('ber');
    press('Enter');
    expect(host.writes).toEqual(['ber']);
    expect(host.termAtActivate).toEqual([]);
    fixture.detectChanges();
    expect(host.termAtActivate).toEqual(['ber']);
    vi.advanceTimersByTime(1000);
    expect(host.writes).toEqual(['ber']);
  });

  it('a host-side close drops the pending write and restores the input to the term', () => {
    const { fixture, host, input, type } = mountDebounced();
    type('ber');
    host.panelOpen.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    expect(host.writes).toEqual([]);
    expect(host.searchTerm()).toBe('');
    expect(input.value).toBe('');
  });

  it('a host-side close keeps a term that already landed', () => {
    const { fixture, host, input, type } = mountDebounced();
    type('ber');
    vi.advanceTimersByTime(300);
    type('berl');
    host.panelOpen.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    expect(host.writes).toEqual(['ber']);
    expect(input.value).toBe('ber');
  });
});
