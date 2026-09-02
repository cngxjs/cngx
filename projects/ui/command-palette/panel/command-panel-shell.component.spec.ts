import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxCommandGroup } from '@cngx/common/command';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxCommandPanelShell } from './command-panel-shell.component';

function makeState(
  status: AsyncStatus,
  firstLoad: boolean,
  data: CngxCommandGroup[],
): CngxAsyncState<CngxCommandGroup[]> {
  return buildAsyncStateView<CngxCommandGroup[]>({
    status: signal(status),
    data: signal(data),
    error: signal(status === 'error' ? new Error('boom') : undefined),
    isFirstLoad: signal(firstLoad),
  });
}

const NON_EMPTY: CngxCommandGroup[] = [{ id: 'g', label: 'Group', commands: [] }];

@Component({
  standalone: true,
  imports: [CngxCommandPanelShell],
  template: `<cngx-command-panel-shell [results]="state()"><p class="projected">body</p></cngx-command-panel-shell>`,
})
class Host {
  readonly state: WritableSignal<CngxAsyncState<CngxCommandGroup[]> | undefined> = signal(undefined);
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

  it('keeps the projected panel mounted on an empty success (input must survive)', () => {
    host.state.set(makeState('success', false, []));
    fixture.detectChanges();
    // The empty rendering is the panel's job (keyed on its result count); the
    // shell must not unmount the projected content - that would unmount the
    // search input mid-typing.
    expect(fixture.nativeElement.querySelector('.projected')).not.toBeNull();
    expect(html()).not.toContain('cngx-command-state--empty');
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
