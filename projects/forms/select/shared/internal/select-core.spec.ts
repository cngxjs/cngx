import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

import {
  provideSelectConfig,
  withAnnouncer,
  withAriaLabels,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
} from '../config';
import type { CngxSelectOptionDef } from '../option.model';
import { createSelectCore, type CngxSelectCoreDeps } from './select-core';

const RED: CngxSelectOptionDef<string> = { value: 'red', label: 'Red' };

function deps(): CngxSelectCoreDeps<string, string> {
  return {
    label: signal(''),
    ariaLabel: signal(null),
    ariaLabelledBy: signal(null),
    placeholder: signal(''),
    idInput: signal(null),
    disabledInput: signal(false),
    requiredInput: signal(false),
    tabIndex: signal(0),
    options: signal([RED]),
    state: signal(null),
    loading: signal(false),
    compareWith: signal(Object.is),
    skeletonRowCount: signal(3),
    panelClass: signal(null),
    panelWidth: signal(null),
    hideSelectionIndicator: signal(false),
    hideCaret: signal(false),
    commitErrorDisplay: signal('banner'),
    commitAction: signal(null),
    panelOpen: signal(false),
    errorState: signal(false),
    multi: signal(false),
    currentSelection: signal(undefined),
    selectionIndicatorPosition: signal(null),
    selectionIndicatorVariant: signal(null),
  };
}

describe('createSelectCore - selection announcement', () => {
  it('does not re-announce on a language flip when announced from an effect', () => {
    const lang = signal<'en' | 'de'>('en');
    const announcer = signal<CngxSelectAnnouncerConfig>({
      format: ({ selectedLabel, fieldLabel }) =>
        lang() === 'de'
          ? `${fieldLabel}: ${selectedLabel} gewählt`
          : `${fieldLabel}: ${selectedLabel} selected`,
    });
    const labels = signal<CngxSelectAriaLabels>({ fieldLabelFallback: 'Selection' });
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withAnnouncer(announcer), withAriaLabels(labels))],
    });
    const live = vi
      .spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce')
      .mockImplementation(() => {});
    const picked = signal<CngxSelectOptionDef<string> | null>(null);

    TestBed.runInInjectionContext(() => {
      const core = createSelectCore(deps(), {
        announceChanges: signal(null),
        announceTemplate: signal(null),
      });
      effect(() => {
        const option = picked();
        if (option) {
          core.announce(option, 'added', 1, false);
        }
      });
    });

    picked.set(RED);
    TestBed.tick();
    expect(live).toHaveBeenCalledExactlyOnceWith('Selection: Red selected', 'polite');

    lang.set('de');
    labels.set({ fieldLabelFallback: 'Auswahl' });
    TestBed.tick();
    expect(live).toHaveBeenCalledTimes(1);

    picked.set({ ...RED });
    TestBed.tick();
    expect(live).toHaveBeenLastCalledWith('Auswahl: Red gewählt', 'polite');
  });
});
