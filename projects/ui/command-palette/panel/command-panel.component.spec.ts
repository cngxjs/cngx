import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideCommands, type CngxCommand, type CommandGroup } from '@cngx/common/command';
import { buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxCommandPanel } from './command-panel.component';

function cmd(id: string, label: string, extra: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label, run: () => {}, ...extra };
}

function successState(data: CommandGroup[]): CngxAsyncState<CommandGroup[]> {
  return buildAsyncStateView<CommandGroup[]>({
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
  readonly results: WritableSignal<CngxAsyncState<CommandGroup[]> | undefined> = signal(undefined);
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
    const reason = fixture.nativeElement.querySelector('[id$="-reason-sync"]') as HTMLElement;
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
});
