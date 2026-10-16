import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxPopover, CngxPopoverSheet } from '@cngx/common/popover';
import { describe, expect, it, vi } from 'vitest';

import { CngxSelectAnnouncer } from '../announcer';
import {
  CNGX_SELECT_SHEET_SCOPE,
  CngxScopedSelectAnnouncer,
  type CngxSelectSheetScope,
} from './scoped-announcer';

type PopoverState = 'closed' | 'opening' | 'open' | 'closing';

function setup() {
  const root = { announce: vi.fn() };
  TestBed.configureTestingModule({
    providers: [{ provide: CngxSelectAnnouncer, useValue: root }],
  });
  const modal = signal(false);
  const sheetAnnounce = vi.fn();
  const state = signal<PopoverState>('closed');
  const sheet = signal<CngxPopoverSheet | undefined>({
    modal,
    announce: sheetAnnounce,
  } as unknown as CngxPopoverSheet);
  const popover = signal<CngxPopover | undefined>({ state } as unknown as CngxPopover);
  const scopeFactory = vi.fn((): CngxSelectSheetScope => ({ sheet, popover }));
  const injector = Injector.create({
    parent: TestBed.inject(Injector),
    providers: [
      { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
      { provide: CNGX_SELECT_SHEET_SCOPE, useFactory: scopeFactory },
    ],
  });
  const announcer = injector.get(CngxSelectAnnouncer);
  return { root, modal, sheetAnnounce, state, sheet, scopeFactory, announcer };
}

describe('CngxScopedSelectAnnouncer', () => {
  it('routes to the root announcer while anchored', () => {
    const { root, sheetAnnounce, state, announcer } = setup();
    state.set('open');
    announcer.announce('Red selected', 'polite');
    expect(root.announce).toHaveBeenCalledExactlyOnceWith('Red selected', 'polite');
    expect(sheetAnnounce).not.toHaveBeenCalled();
  });

  it.each(['opening', 'open'] as const)(
    'routes only to the sheet region while modal and %s',
    (popoverState) => {
      const { root, modal, sheetAnnounce, state, announcer } = setup();
      modal.set(true);
      state.set(popoverState);
      announcer.announce('Red selected');
      expect(sheetAnnounce).toHaveBeenCalledExactlyOnceWith('Red selected', 'polite');
      expect(root.announce).not.toHaveBeenCalled();
    },
  );

  it.each(['closing', 'closed'] as const)(
    'hands back to the root announcer once the modal sheet is %s',
    (popoverState) => {
      const { root, modal, sheetAnnounce, state, announcer } = setup();
      modal.set(true);
      state.set(popoverState);
      announcer.announce('Red selected');
      expect(root.announce).toHaveBeenCalledExactlyOnceWith('Red selected', 'polite');
      expect(sheetAnnounce).not.toHaveBeenCalled();
    },
  );

  it('keeps an assertive commit error assertive inside the sheet', () => {
    const { modal, sheetAnnounce, state, announcer } = setup();
    modal.set(true);
    state.set('open');
    announcer.announce('Colours: Save failed', 'assertive');
    expect(sheetAnnounce).toHaveBeenCalledExactlyOnceWith('Colours: Save failed', 'assertive');
  });

  it('delegates to a root override when no sheet is rendered', () => {
    const { root, sheet, announcer } = setup();
    sheet.set(undefined);
    announcer.announce('Red selected', 'assertive');
    expect(root.announce).toHaveBeenCalledExactlyOnceWith('Red selected', 'assertive');
  });

  it('resolves the scope on the first announce and only once', () => {
    const { scopeFactory, announcer } = setup();
    expect(scopeFactory).not.toHaveBeenCalled();
    announcer.announce('a');
    announcer.announce('b');
    expect(scopeFactory).toHaveBeenCalledTimes(1);
  });
});
