import { effect, signal } from '@angular/core';
import type { CngxPopoverPresentation, CngxPopoverPresentationRequest } from '@cngx/common/popover';
import { SIGNAL, type ReactiveNode } from '@angular/core/primitives/signals';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CNGX_DEV_DESCRIPTORS } from '@cngx/core/utils';
import { createManualState } from '@cngx/common/data';
import { stripBidiIsolates } from '@cngx/testing';

import {
  provideSelectConfig,
  withAnnouncer,
  withAriaLabels,
  withMobileSheet,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
} from '../config';
import type { CngxSelectOptionDef } from '../option.model';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
  type CngxCommitErrorAnnouncerFactory,
} from '../commit-error-announcer';
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
  function coreWith(extra: Partial<CngxSelectCoreDeps<string, string>>, providers: unknown[] = []) {
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

describe('createSelectCore - commit ledger retry', () => {
  it('routes Retry to the handler that started the last commit', () => {
    const core = TestBed.runInInjectionContext(() =>
      createSelectCore(deps(), { announceChanges: signal(null), announceTemplate: signal(null) }),
    );
    const log: string[] = [];
    const handler = (name: string) => ({
      begin: () => log.push(`begin:${name}`),
      retryLast: () => log.push(`retry:${name}`),
    });
    const a = core.routeRetryThrough(handler('a'), ['begin']);
    const b = core.routeRetryThrough(handler('b'), ['begin']);
    const context = core.bindCommitRetry();
    context().retry();
    expect(log).toEqual([]);
    a.begin();
    context().retry();
    b.begin();
    context().retry();
    a.retryLast();
    expect(log).toEqual(['begin:a', 'retry:a', 'begin:b', 'retry:b', 'retry:a']);
    const owner = { retryLast: () => log.push('retry:claimed') };
    core.claimCommitRetry(owner);
    core.retryLastCommit();
    expect(log.at(-1)).toBe('retry:claimed');
  });

  it('reads the option from the ledger record, else from the toggling option', () => {
    const core = TestBed.runInInjectionContext(() =>
      createSelectCore(deps(), { announceChanges: signal(null), announceTemplate: signal(null) }),
    );
    const context = core.bindCommitRetry(() => undefined);
    expect(context().option).toBeNull();
    core.togglingOption.set(RED);
    expect(context().option).toBe(RED);
  });

  it('reads the option from the ledger record and replays it through a ledger-backed retry', () => {
    const core = TestBed.runInInjectionContext(() =>
      createSelectCore(deps(), { announceChanges: signal(null), announceTemplate: signal(null) }),
    );
    const value = signal<string | undefined>(undefined);
    const calls: (string | undefined)[] = [];
    const commitAction = signal<((next: string | undefined) => never) | null>((next) => {
      calls.push(next);
      throw new Error('down');
    });
    core.commitLedger.beginScalar<string | undefined>({
      kind: 'select',
      next: 'red',
      previous: undefined,
      option: RED,
      action: commitAction()!,
      commitAction,
      value,
      same: Object.is,
      commitMode: signal('pessimistic'),
      onSuccess: () => undefined,
    });
    core.togglingOption.set(null);
    const context = core.bindCommitRetry(() => core.commitLedger.retry());
    expect(context().option).toBe(RED);
    context().retry();
    expect(calls).toEqual(['red', 'red']);
  });
});

describe('createSelectCore - commit-error announcer', () => {
  function coreWith(
    providers: unknown[],
    coreDeps: CngxSelectCoreDeps<string, string> = deps(),
  ): ReturnType<typeof createSelectCore<string, string>> {
    TestBed.configureTestingModule({ providers: providers as never[] });
    return TestBed.runInInjectionContext(() =>
      createSelectCore(coreDeps, { announceChanges: signal(null), announceTemplate: signal(null) }),
    );
  }

  it('builds the callback through a provided CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY', () => {
    const announced: unknown[] = [];
    const factory = vi.fn<CngxCommitErrorAnnouncerFactory>(() => (err) => announced.push(err));
    const core = coreWith([{ provide: CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY, useValue: factory }]);
    const policy = signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' });

    const callback = core.createCommitErrorAnnouncer({ policy });
    const failure = new Error('down');
    callback(failure);

    expect(factory).toHaveBeenCalledTimes(1);
    const options = factory.mock.calls[0][0];
    expect(options.policy).toBe(policy);
    expect(options.deps.softFailureMessage?.()).toContain('Save failed, previous value restored');
    expect(options.deps.commitErrorMessage(failure)).toBe(core.commitErrorMessage(failure));
    expect(announced).toEqual([failure]);
  });

  it('uses the message override for the verbose sentence', () => {
    const factory = vi.fn<CngxCommitErrorAnnouncerFactory>(() => () => undefined);
    const core = coreWith([{ provide: CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY, useValue: factory }]);

    core.createCommitErrorAnnouncer({
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'verbose', severity: 'assertive' }),
      message: () => 'Colour: Could not create Teal',
    });

    expect(factory.mock.calls[0][0].deps.commitErrorMessage(new Error('x'))).toBe(
      'Colour: Could not create Teal',
    );
  });

  it('defaults to createCommitErrorAnnouncer and speaks the soft copy politely after a rollback', () => {
    const core = coreWith([]);
    const live = vi
      .spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce')
      .mockImplementation(() => {});
    const callback = core.createCommitErrorAnnouncer({
      policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'soft' }),
    });
    callback(new Error('down'), true);
    expect(live).toHaveBeenCalledTimes(1);
    expect(String(live.mock.calls[0][0])).toContain('Save failed, previous value restored');
    expect(live.mock.calls[0][1]).toBe('polite');
  });
});

describe('createSelectCore - trigger ARIA control hooks', () => {
  function coreWith(extra: Partial<CngxSelectCoreDeps<string, string>>) {
    return TestBed.runInInjectionContext(() =>
      createSelectCore(
        { ...deps(), ...extra },
        { announceChanges: signal(null), announceTemplate: signal(null) },
      ),
    );
  }

  it('lets the [id] input win and keeps the empty id without one', () => {
    const idInput = signal<string | null>('own-id');
    const core = coreWith({ idInput });
    expect(core.resolvedId()).toBe('own-id');
    idInput.set(null);
    expect(core.resolvedId()).toBe('');
  });

  it('projects [required], aria-labelledby and disabled without a field', () => {
    const core = coreWith({
      requiredInput: signal(true),
      ariaLabelledBy: signal('ext-label'),
      disabledInput: signal(true),
    });
    expect(core.triggerAria()).toMatchObject({
      required: true,
      labelledBy: 'ext-label',
      disabled: true,
    });
    expect(core.effectiveTabIndex()).toBe(-1);
  });

  it('marks the trigger busy while the options state loads or refreshes', () => {
    const state = TestBed.runInInjectionContext(() =>
      createManualState<CngxSelectOptionDef<string>[]>(),
    );
    const core = coreWith({ state: signal(state) });
    expect(core.ariaBusy()).toBeNull();
    state.set('loading');
    expect(core.ariaBusy()).toBe(true);
    state.setSuccess([RED]);
    expect(core.ariaBusy()).toBeNull();
    state.set('refreshing');
    expect(core.ariaBusy()).toBe(true);
  });

  it('marks the trigger invalid after a failed commit unless the display is none', () => {
    const display = signal<'banner' | 'none'>('banner');
    const core = coreWith({ commitErrorDisplay: display });
    core.commitController.begin(
      () => {
        throw new Error('boom');
      },
      'red',
      undefined,
      { onSuccess: () => undefined, onError: () => undefined },
    );
    expect(core.ariaInvalid()).toBe(true);
    expect(core.ariaErrorMessage()).toBe(core.commitErrorId);
    expect(core.commitErrorText()).toContain('boom');
    display.set('none');
    expect(core.ariaInvalid()).toBeNull();
    expect(core.ariaErrorMessage()).toBeNull();
    expect(core.commitErrorText()).toBe('');
  });

  it('leaves aria-describedby untouched without a summary description', () => {
    expect(coreWith({}).triggerAria().describedBy).toBeNull();
  });

  it('references the summary description only while it is set', () => {
    const summary = signal<string | null>(null);
    const core = coreWith({ summaryDescribedBy: summary });
    expect(core.triggerAria().describedBy).toBeNull();
    summary.set('sum-1');
    expect(core.triggerAria().describedBy).toBe('sum-1');
    summary.set(null);
    expect(core.triggerAria().describedBy).toBeNull();
  });

  it('appends the summary description after the commit-error reference', () => {
    const core = coreWith({ summaryDescribedBy: signal('sum-1') });
    core.commitController.begin(
      () => {
        throw new Error('boom');
      },
      'red',
      undefined,
      { onSuccess: () => undefined, onError: () => undefined },
    );
    expect(core.triggerAria().describedBy).toBe(`${core.commitErrorId} sum-1`);
  });

  it('keeps the triggerAria reference across an unrelated change', () => {
    const label = signal('');
    const core = coreWith({ label, ariaLabelledBy: signal('ext-label') });
    const before = core.triggerAria();
    label.set('Colour');
    expect(core.triggerAria()).toBe(before);
  });
});

describe('select-core removed aliases', () => {
  it('no longer exports CngxSelectFormFieldControl or CngxSelectStatus', () => {
    // @ts-expect-error - removed, use CngxFormFieldControl
    const control: import('./select-core').CngxSelectFormFieldControl | undefined = undefined;
    // @ts-expect-error - removed, use AsyncStatus
    const status: import('./select-core').CngxSelectStatus | undefined = undefined;
    expect(control).toBeUndefined();
    expect(status).toBeUndefined();
  });
});

describe('createSelectCore - non-Error failure detail', () => {
  function labelledCore(): ReturnType<typeof createSelectCore<string, string>> {
    return TestBed.runInInjectionContext(() =>
      createSelectCore(
        { ...deps(), label: signal('Colour') },
        { announceChanges: signal(null), announceTemplate: signal(null) },
      ),
    );
  }

  it('speaks the bare commit sentence for a non-Error rejection, never its value', () => {
    const core = labelledCore();
    expect(stripBidiIsolates(core.commitErrorMessage('server down'))).toBe('Colour: Save failed');
    expect(stripBidiIsolates(core.commitErrorMessage({ status: 500 }))).toBe('Colour: Save failed');
    expect(stripBidiIsolates(core.commitErrorMessage(new Error('server down')))).toBe(
      'Colour: Save failed - server down',
    );
  });

  it('speaks the bare create sentence for a non-Error rejection', () => {
    const core = labelledCore();
    expect(stripBidiIsolates(core.createFailedMessage('Teal', 'server down'))).toBe(
      'Colour: Could not create Teal',
    );
    expect(stripBidiIsolates(core.createFailedMessage('Teal', new Error('server down')))).toBe(
      'Colour: Could not create Teal - server down',
    );
  });
});
