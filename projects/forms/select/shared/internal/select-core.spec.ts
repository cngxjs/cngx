import { effect, signal } from '@angular/core';
import type { CngxPopoverPresentation, CngxPopoverPresentationRequest } from '@cngx/common/popover';
import { SIGNAL, type ReactiveNode } from '@angular/core/primitives/signals';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_DEV_DESCRIPTORS } from '@cngx/core/utils';

import {
  provideSelectConfig,
  withAnnouncer,
  withAriaLabels,
  withMobileSheet,
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

describe('createSelectCore - dev descriptor', () => {
  it('tags the core with its factory name and names its retry-context signals', () => {
    const coreDeps = deps();
    const core = TestBed.runInInjectionContext(() =>
      createSelectCore(coreDeps, {
        announceChanges: signal(null),
        announceTemplate: signal(null),
      }),
    );
    const nameOf = (s: object): string | undefined =>
      (s as unknown as Record<symbol, ReactiveNode>)[SIGNAL].debugName;

    expect(CNGX_DEV_DESCRIPTORS.read(core)).toMatchObject({
      kind: 'cngx-dev:factory',
      factory: 'createSelectCore',
      inputs: { deps: coreDeps },
    });
    expect(nameOf(core.bindCommitRetry(() => {}))).toBe('selectCore.commitErrorContext');
    expect(nameOf(core.makeErrorContext(() => {}))).toBe('selectCore.errorContext');
    expect(nameOf(core.selection)).toBe('selectCore.selection');
  });
});

describe('createSelectCore - mobile sheet presentation', () => {
  function coreWith(
    extra: Partial<CngxSelectCoreDeps<string, string>>,
    providers: unknown[] = [],
  ) {
    TestBed.configureTestingModule({ providers: providers as never[] });
    return TestBed.runInInjectionContext(() =>
      createSelectCore(
        { ...deps(), ...extra },
        { announceChanges: signal(null), announceTemplate: signal(null) },
      ),
    );
  }

  it('requests auto by default', () => {
    expect(coreWith({}).resolvedPresentationRequest()).toBe('auto');
  });

  it('requests anchored under withMobileSheet("off")', () => {
    const core = coreWith({}, [provideSelectConfig(withMobileSheet('off'))]);
    expect(core.resolvedPresentationRequest()).toBe('anchored');
  });

  it('lets the per-instance input win over the config, and falls back when it is unset', () => {
    const input = signal<CngxPopoverPresentationRequest | undefined>('sheet');
    const core = coreWith({ presentationInput: input }, [
      provideSelectConfig(withMobileSheet('off')),
    ]);
    expect(core.resolvedPresentationRequest()).toBe('sheet');
    input.set(undefined);
    expect(core.resolvedPresentationRequest()).toBe('anchored');
  });

  it('drops the trigger-width rule outside the anchored presentation', () => {
    const presentation = signal<CngxPopoverPresentation>('anchored');
    const core = coreWith({ panelWidth: signal('trigger'), presentation });
    expect(core.panelWidthCss()).toBe('anchor-size(width)');
    presentation.set('sheet');
    expect(core.panelWidthCss()).toBeNull();
    presentation.set('fullscreen');
    expect(core.panelWidthCss()).toBeNull();
    presentation.set('anchored');
    expect(core.panelWidthCss()).toBe('anchor-size(width)');
  });

  it('keeps the width rule without a presentation dep', () => {
    expect(coreWith({ panelWidth: signal(240) }).panelWidthCss()).toBe('240px');
  });
});
