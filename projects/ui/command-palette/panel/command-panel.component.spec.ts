import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideCommands, type CngxCommand, type CngxCommandGroup } from '@cngx/common/command';
import { buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxCommandPanel } from './command-panel.component';
import { CNGX_COMMAND_PALETTE_HOST } from './panel-host.token';

function cmd(id: string, label: string, extra: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label, run: () => {}, ...extra };
}

function successState(data: CngxCommandGroup[]): CngxAsyncState<CngxCommandGroup[]> {
  return buildAsyncStateView<CngxCommandGroup[]>({
    status: signal('success'),
    data: signal(data),
    error: signal(undefined),
    isFirstLoad: signal(false),
  });
}

@Component({
  standalone: true,
  imports: [CngxCommandPanel],
  template: `<cngx-command-panel [results]="results()" [debounceMs]="0" />`,
})
class Host {
  readonly results: WritableSignal<CngxAsyncState<CngxCommandGroup[]> | undefined> = signal(undefined);
}

describe('CngxCommandPanel', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;

  function configure(commands: CngxCommand[]): void {
    TestBed.configureTestingModule({ providers: [provideCommands(commands)] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  }

  function options(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  }

  function labels(): string[] {
    return options().map((el) => (el.textContent ?? '').trim());
  }

  function type(term: string): void {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(1);
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders consumer async groups before the static registry on an empty term', () => {
    configure([cmd('static-a', 'Static A')]);
    fixture.componentInstance.results.set(
      successState([{ id: 'recents', label: 'Recents', commands: [cmd('r1', 'Recent one')] }]),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-command-group-header'),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(headers[0]).toBe('Recents');
    expect(labels()).toEqual(expect.arrayContaining(['Recent one', 'Static A']));
  });

  it('feeds the ranked list to the listbox in final order with no double-filter', () => {
    configure([cmd('save', 'Save'), cmd('save-as', 'Save as...'), cmd('close', 'Close'), cmd('reload', 'Reload')]);
    type('sav');
    expect(labels()).toEqual(['Save', 'Save as...']);
  });

  it('re-highlights the top result after the ranked list changes', () => {
    configure([cmd('save', 'Save'), cmd('reload', 'Reload')]);
    type('sav');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const first = options()[0];
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
  });

  it('highlights the matched substring inside the row label', () => {
    configure([cmd('save', 'Save')]);
    type('sav');
    const mark = fixture.nativeElement.querySelector('.cngx-command-row-label mark') as HTMLElement;
    expect(mark).not.toBeNull();
    expect(mark.textContent?.toLowerCase()).toBe('sav');
  });

  it('points aria-describedby at the reason for a disabled command', () => {
    configure([cmd('sync', 'Sync', { disabled: signal(true), disabledReason: 'Offline' })]);
    const option = options()[0];
    const describedBy = option.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    const reason = fixture.nativeElement.querySelector(`#${describedBy}`) as HTMLElement;
    expect(reason.textContent).toBe('Offline');
  });

  it('keeps the reason target in the DOM but omits the reference while enabled', () => {
    configure([cmd('sync', 'Sync', { disabled: signal(false), disabledReason: 'Offline' })]);
    const option = options()[0];
    // Reference gated off while enabled...
    expect(option.getAttribute('aria-describedby')).toBeNull();
    // ...but the target node is present, so it never appears/disappears mid-interaction.
    const reason = fixture.nativeElement.querySelector('[id*="-reason-"]') as HTMLElement;
    expect(reason?.textContent).toBe('Offline');
  });

  it('does not run a command when its run is invoked through a disabled row', () => {
    const run = vi.fn();
    configure([cmd('sync', 'Sync', { disabled: signal(true), disabledReason: 'Offline', run })]);
    const option = options()[0];
    option.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    TestBed.flushEffects();
    expect(run).not.toHaveBeenCalled();
  });

  it('renders the empty state in static-registry mode when no command matches', () => {
    configure([cmd('save', 'Save')]);
    type('zzz');
    expect(fixture.nativeElement.querySelector('.cngx-command-state--empty')).not.toBeNull();
    // The search input stays mounted - typing continues to refine the term.
    expect(fixture.nativeElement.querySelector('input[cngxSearch]')).not.toBeNull();
  });

  it('keeps the input mounted and shows the empty state on an empty async success', () => {
    configure([cmd('save', 'Save')]);
    fixture.componentInstance.results.set(successState([]));
    type('zzz');
    expect(fixture.nativeElement.querySelector('input[cngxSearch]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cngx-command-state--empty')).not.toBeNull();
  });

  it('hides the empty state as soon as any result exists', () => {
    configure([cmd('save', 'Save')]);
    type('sav');
    expect(fixture.nativeElement.querySelector('.cngx-command-state--empty')).toBeNull();
  });

  it('mints group header ids instead of echoing user strings into the DOM', () => {
    configure([cmd('a', 'Alpha', { group: 'My "quoted" & spaced group' })]);
    const header = fixture.nativeElement.querySelector('.cngx-command-group-header') as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.id).toMatch(/^cngx-command-listbox-\d+-g\d+-h$/);
    const groupEl = header.closest('[role="group"]') as HTMLElement;
    expect(groupEl.getAttribute('aria-labelledby')).toBe(header.id);
  });

  it('keeps the unlabelled bucket distinct from a group literally named "ungrouped"', () => {
    configure([cmd('a', 'Alpha'), cmd('b', 'Beta', { group: 'ungrouped' })]);
    const groups = Array.from(
      fixture.nativeElement.querySelectorAll('[role="group"]'),
    ) as HTMLElement[];
    expect(groups.length).toBe(2);
    expect(labels()).toEqual(['Alpha', 'Beta']);
  });

  it('re-resolves the highlight by value when async groups prepend', () => {
    configure([cmd('save', 'Save'), cmd('reload', 'Reload')]);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();
    const reload = options().find((el) => el.textContent?.trim() === 'Reload') as HTMLElement;
    expect(input.getAttribute('aria-activedescendant')).toBe(reload.id);

    fixture.componentInstance.results.set(
      successState([
        {
          id: 'recents',
          label: 'Recents',
          commands: [cmd('r1', 'Recent one'), cmd('r2', 'Recent two')],
        },
      ]),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    // Two items prepended above the highlight: an index-based highlight would
    // now sit on "Recent two". Enter must still run the item the user saw.
    const reloadAfter = options().find((el) => el.textContent?.trim() === 'Reload') as HTMLElement;
    expect(input.getAttribute('aria-activedescendant')).toBe(reloadAfter.id);
  });

  it('does not fight explicit navigation after a prepend settles', () => {
    configure([cmd('save', 'Save'), cmd('reload', 'Reload')]);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    fixture.componentInstance.results.set(
      successState([{ id: 'recents', label: 'Recents', commands: [cmd('r1', 'Recent one')] }]),
    );
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();
    // The prepend preserved the highlight on "Save"; one ArrowDown moves it to
    // "Reload" and the re-resolver must not snap it back.
    const reload = options().find((el) => el.textContent?.trim() === 'Reload') as HTMLElement;
    expect(input.getAttribute('aria-activedescendant')).toBe(reload.id);
  });

  it('resets term and highlight when the host surface closes', () => {
    const isOpen = signal(true);
    TestBed.configureTestingModule({
      providers: [
        provideCommands([cmd('save', 'Save'), cmd('reload', 'Reload')]),
        { provide: CNGX_COMMAND_PALETTE_HOST, useValue: { isOpen, dismiss: () => {} } },
      ],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    type('sav');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('sav');
    expect(labels()).toEqual(['Save']);

    isOpen.set(false);
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    // The next open starts clean: input text gone, full list back, highlight
    // reset to the top via autoHighlightFirst.
    expect(input.value).toBe('');
    expect(labels()).toEqual(['Save', 'Reload']);
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('passes modified key combos through instead of navigating', () => {
    configure([cmd('save', 'Save'), cmd('reload', 'Reload')]);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const before = input.getAttribute('aria-activedescendant');

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(input.getAttribute('aria-activedescendant')).toBe(before);
  });
});
