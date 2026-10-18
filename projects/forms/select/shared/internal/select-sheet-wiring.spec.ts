import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxListbox } from '@cngx/common/interactive';
import type {
  CngxPopover,
  CngxPopoverPresentation,
  CngxPopoverPresentationRequest,
  CngxPopoverSheet,
} from '@cngx/common/popover';
import { describe, expect, it, vi } from 'vitest';

import type { CngxSelectCommitMode } from '../commit-action.types';
import { CNGX_DISMISS_HANDLER_FACTORY, type DismissHandler } from '../dismiss-handler';
import type { CngxSelectCore } from './select-core';
import { createSelectSheetWiring, type CngxSelectSheetWiring } from './select-sheet-wiring';

function setup(
  options: { dismiss?: DismissHandler; dismissOn?: 'outside' | 'escape' | 'both' } = {},
) {
  if (options.dismiss) {
    const dismiss = options.dismiss;
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_DISMISS_HANDLER_FACTORY, useValue: () => dismiss }],
    });
  }
  const presentation = signal<CngxPopoverPresentation>('anchored');
  const sheet = {
    presentation,
    modal: computed(() => presentation() !== 'anchored'),
    announce: vi.fn(),
  } as unknown as CngxPopoverSheet;
  const visible = signal(true);
  const state = signal<'open' | 'closing' | 'closed'>('open');
  const hide = vi.fn(() => {
    visible.set(false);
    state.set('closed');
  });
  const popover = {
    isVisible: visible,
    state,
    hide,
    id: signal('panel-1'),
  } as unknown as CngxPopover;
  const isCommitting = signal(false);
  const disabled = signal(false);
  const request = signal<CngxPopoverPresentationRequest>('auto');
  const core = {
    isCommitting,
    resolvedPresentationRequest: request,
    ariaLabels: signal({}),
    disabled,
  } as unknown as CngxSelectCore<string, string>;
  const commitMode = signal<CngxSelectCommitMode>('optimistic');
  const close = vi.fn();
  const wiring: CngxSelectSheetWiring = TestBed.runInInjectionContext(() =>
    createSelectSheetWiring({
      core,
      sheet: signal(sheet),
      popoverRef: signal(popover),
      listboxRef: signal<CngxListbox | undefined>(undefined),
      tpl: { sheetHandle: signal(null) },
      commitMode,
      dismissOn: options.dismissOn ?? 'both',
      showDone: true,
      showInput: false,
      sheetLabel: signal(undefined),
      label: signal('Colour'),
      close,
    }),
  );
  const pend = () => {
    commitMode.set('pessimistic');
    isCommitting.set(true);
  };
  return {
    wiring,
    presentation,
    sheet,
    visible,
    state,
    hide,
    isCommitting,
    commitMode,
    close,
    pend,
    request,
    disabled,
  };
}

describe('createSelectSheetWiring', () => {
  it('forwards the core presentation request and derives the sheet flags', () => {
    const { wiring, presentation, request } = setup();
    expect(wiring.presentationRequest()).toBe('auto');
    request.set('fullscreen');
    expect(wiring.presentationRequest()).toBe('fullscreen');

    expect(wiring.presentation()).toBe('anchored');
    expect(wiring.sheetAnchored()).toBe(true);
    expect(wiring.sheetModal()).toBe(false);
    presentation.set('sheet');
    expect(wiring.sheetAnchored()).toBe(false);
    expect(wiring.sheetModal()).toBe(true);
  });

  it('hides an open panel once the select turns disabled', () => {
    const { disabled, hide, visible } = setup();
    TestBed.flushEffects();
    expect(hide).not.toHaveBeenCalled();
    disabled.set(true);
    TestBed.flushEffects();
    expect(hide).toHaveBeenCalledTimes(1);
    expect(visible()).toBe(false);
    disabled.set(false);
    TestBed.flushEffects();
    disabled.set(true);
    TestBed.flushEffects();
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('blocks a close only while a pessimistic commit is pending', () => {
    const { wiring, isCommitting, commitMode } = setup();
    isCommitting.set(true);
    expect(wiring.closeBlocked()).toBe(false);
    commitMode.set('pessimistic');
    expect(wiring.closeBlocked()).toBe(true);
    isCommitting.set(false);
    expect(wiring.closeBlocked()).toBe(false);
  });

  it('keeps Escape enabled on desktop during a pessimistic pending commit', () => {
    const { wiring, presentation, pend } = setup();
    pend();
    expect(wiring.escapeEnabled()).toBe(true);
    presentation.set('sheet');
    expect(wiring.escapeEnabled()).toBe(false);
  });

  it("keeps Escape off on every path under dismissOn 'outside'", () => {
    const { wiring, presentation, close, hide } = setup({ dismissOn: 'outside' });
    expect(wiring.escapeEnabled()).toBe(false);
    wiring.escapeClose();
    expect(close).not.toHaveBeenCalled();
    presentation.set('sheet');
    expect(wiring.escapeEnabled()).toBe(false);
    wiring.escapeClose();
    expect(hide).not.toHaveBeenCalled();
  });

  it('enables the variant outside-click path only while anchored and open', () => {
    const { wiring, presentation, visible } = setup();
    expect(wiring.clickOutsideEnabled()).toBe(true);
    presentation.set('fullscreen');
    expect(wiring.clickOutsideEnabled()).toBe(false);
    presentation.set('anchored');
    visible.set(false);
    expect(wiring.clickOutsideEnabled()).toBe(false);
  });

  it('routes escapeClose through the gate while modal and to close() while anchored', () => {
    const { wiring, presentation, hide, close, pend } = setup();
    wiring.escapeClose();
    expect(close).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();

    presentation.set('sheet');
    pend();
    wiring.escapeClose();
    expect(hide).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('hides on a sheet close request through the default dismiss handler', () => {
    const { wiring, hide } = setup();
    wiring.handleSheetClose('back');
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('keeps the sheet open on every vector while a pessimistic commit is pending', () => {
    const { wiring, presentation, hide, pend } = setup();
    presentation.set('sheet');
    pend();
    for (const reason of ['swipe', 'back', 'close', 'backdrop'] as const) {
      wiring.handleSheetClose(reason);
    }
    wiring.headerHost.close();
    expect(hide).not.toHaveBeenCalled();
  });

  it('falls back for a custom dismiss handler without handleSheetClose', () => {
    const handleClickOutside = vi.fn();
    const { wiring, hide, pend } = setup({ dismiss: { handleClickOutside } });
    wiring.handleSheetClose('backdrop');
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
    wiring.handleSheetClose('swipe');
    expect(hide).toHaveBeenCalledTimes(1);

    pend();
    wiring.handleSheetClose('backdrop');
    expect(handleClickOutside).toHaveBeenCalledTimes(1);
  });

  it('speaks through the sheet only while modal and open', () => {
    const { wiring, presentation, state, sheet } = setup();
    expect(wiring.speakingSheet()).toBeUndefined();
    presentation.set('sheet');
    expect(wiring.speakingSheet()).toBe(sheet);
    state.set('closing');
    expect(wiring.speakingSheet()).toBeUndefined();
  });

  it('fills the header host from the variant', () => {
    const { wiring, presentation } = setup();
    const host = wiring.headerHost;
    expect(host.showDone()).toBe(true);
    expect(host.showInput()).toBe(false);
    expect(host.panelId()).toBe('panel-1');
    expect(host.label()).toBe('Colour');
    expect(host.searchTerm()).toBe('');
    // No trigger input: the write is a no-op.
    host.setSearchTerm('re');
    presentation.set('fullscreen');
    expect(host.presentation()).toBe('fullscreen');
  });

  it('writes the header term through the trigger input', () => {
    const input = document.createElement('input');
    const seen: string[] = [];
    input.addEventListener('input', () => seen.push(input.value));
    const wiring = TestBed.runInInjectionContext(() =>
      createSelectSheetWiring({
        core: {
          isCommitting: signal(false),
          resolvedPresentationRequest: signal('auto'),
          ariaLabels: signal({}),
        } as unknown as CngxSelectCore<string, string>,
        sheet: signal(undefined),
        popoverRef: signal(undefined),
        listboxRef: signal(undefined),
        tpl: { sheetHandle: signal(null) },
        dismissOn: 'both',
        showDone: true,
        showInput: true,
        sheetLabel: signal(undefined),
        label: signal(''),
        searchInput: signal({ nativeElement: input }),
        close: vi.fn(),
      }),
    );
    wiring.headerHost.setSearchTerm('gr');
    expect(input.value).toBe('gr');
    expect(seen).toEqual(['gr']);
  });
});
