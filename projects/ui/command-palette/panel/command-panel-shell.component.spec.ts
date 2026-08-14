import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CommandGroup } from '@cngx/common/command';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxCommandPanelShell } from './command-panel-shell.component';

function makeState(
  status: AsyncStatus,
  firstLoad: boolean,
  data: CommandGroup[],
): CngxAsyncState<CommandGroup[]> {
  return buildAsyncStateView<CommandGroup[]>({
    status: signal(status),
    data: signal(data),
    error: signal(status === 'error' ? new Error('boom') : undefined),
    isFirstLoad: signal(firstLoad),
  });
}

const NON_EMPTY: CommandGroup[] = [{ id: 'g', label: 'Group', commands: [] }];

@Component({
  standalone: true,
  imports: [CngxCommandPanelShell],
  template: `<cngx-command-panel-shell [results]="state()"><p class="projected">body</p></cngx-command-panel-shell>`,
})
class Host {
  readonly state: WritableSignal<CngxAsyncState<CommandGroup[]> | undefined> = signal(undefined);
}

describe('CngxCommandPanelShell', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  let host: Host;

  beforeEach(() => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function html(): string {
    return (fixture.nativeElement as HTMLElement).innerHTML;
  }

  it('projects the panel content when no async source is bound', () => {
    expect(fixture.nativeElement.querySelector('.projected')).not.toBeNull();
  });

  it('shows the skeleton state on first load', () => {
    host.state.set(makeState('loading', true, []));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.projected')).toBeNull();
  });

  it('shows the empty state on an empty success', () => {
    host.state.set(makeState('success', false, []));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cngx-command-state--empty')).not.toBeNull();
  });

  it('shows the error state on a first-load failure', () => {
    host.state.set(makeState('error', true, []));
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.cngx-command-state--error');
    expect(error).not.toBeNull();
    expect(error.getAttribute('role')).toBe('alert');
  });

  it('keeps content visible with an error banner on a re-query error', () => {
    host.state.set(makeState('error', false, NON_EMPTY));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cngx-command-state--error-banner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.projected')).not.toBeNull();
  });

  it('projects content on a non-empty success', () => {
    host.state.set(makeState('success', false, NON_EMPTY));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.projected')).not.toBeNull();
    expect(html()).not.toContain('cngx-command-state--empty');
  });
});
