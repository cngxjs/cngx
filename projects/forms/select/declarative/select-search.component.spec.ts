import { Component, Directive, model, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

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
