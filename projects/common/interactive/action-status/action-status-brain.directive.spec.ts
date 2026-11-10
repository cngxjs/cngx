import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAsyncStateView,
  CNGX_LOADING_DEFAULTS,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import { CngxAsyncClick, type CngxAsyncSettle } from '../async-click/async-click.directive';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '../async-click/host-interaction-state.token';
import { CngxFailed, CngxPending, CngxSucceeded } from '../async-click/async-status-templates';
import { provideInteractiveI18n, withInteractiveI18nLabels } from '../i18n/interactive-i18n';
import { CngxActionStatusBrain } from './action-status-brain.directive';
import { CngxActionStatusCell } from './action-status-cell.directive';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  type CngxActionOutcome,
  type CngxActionStatus,
} from './action-status.token';

const covered = new Set<'success' | 'error'>();

/** A minimal action host on the brain directives alone, no button family. */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testActionHost]',
  imports: [NgTemplateOutlet, CngxActionStatusCell],
  hostDirectives: [
    {
      directive: CngxAsyncClick,
      inputs: ['cngxAsyncClick: action', 'showDelay', 'minDwell'],
    },
    {
      directive: CngxActionStatusBrain,
      inputs: [
        'succeededAnnouncement',
        'failedAnnouncement',
        'autoAnnounce',
        'pendingLabel',
        'succeededLabel',
        'failedLabel',
        'externalState',
      ],
    },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => {
        const status = inject(CNGX_ACTION_STATUS);
        return {
          disabled: signal(false),
          busy: status.externalBusy,
          announcement: status.announcement,
        };
      },
    },
    {
      provide: CNGX_ANNOUNCEMENT_COVER,
      useValue: { covers: (s: 'success' | 'error') => covered.has(s) },
      multi: true,
    },
    { provide: CNGX_ANNOUNCEMENT_COVER, useValue: { covers: () => false }, multi: true },
  ],
  template: `
    <span cngxActionStatusCell="idle" class="cell"><ng-content /></span>
    @if (status.hasCell().pending) {
      <span cngxActionStatusCell="pending" class="cell">
        @if (status.pendingTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          {{ status.pendingText() }}
        }
      </span>
    }
    @if (status.hasCell().success) {
      <span cngxActionStatusCell="success" class="cell">
        @if (status.succeededTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          {{ status.succeededText() }}
        }
      </span>
    }
    @if (status.hasCell().error) {
      <span cngxActionStatusCell="error" class="cell">
        @if (status.failedTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: { $implicit: status.error() }" />
        } @else {
          {{ status.failedText() }}
        }
      </span>
    }
  `,
})
class TestActionHost {
  protected readonly status = inject(CNGX_ACTION_STATUS);
}

@Component({
  imports: [TestActionHost, CngxPending, CngxSucceeded, CngxFailed],
  template: `
    <button
      testActionHost
      [action]="action"
      [succeededAnnouncement]="succeededAnnouncement()"
      [failedAnnouncement]="failedAnnouncement()"
      [autoAnnounce]="autoAnnounce()"
      [pendingLabel]="pendingLabel()"
      [succeededLabel]="succeededLabel()"
      [failedLabel]="failedLabel()"
      [externalState]="ext()"
    >
      Save
      @if (templates()) {
        <ng-template cngxPending>Saving tpl</ng-template>
        <ng-template cngxSucceeded>OK <span aria-hidden="true">*</span></ng-template>
        <ng-template cngxFailed let-err>Err: {{ err }}</ng-template>
      }
    </button>
  `,
})
class Host {
  actionImpl: () => Promise<unknown> = () => Promise.resolve();
  readonly action = () => this.actionImpl();
  readonly templates = signal(false);
  readonly succeededAnnouncement = signal<string | undefined>(undefined);
  readonly failedAnnouncement = signal<string | undefined>(undefined);
  readonly autoAnnounce = signal<boolean | undefined>(undefined);
  readonly pendingLabel = signal<string | undefined>(undefined);
  readonly succeededLabel = signal<string | undefined>(undefined);
  readonly failedLabel = signal<string | undefined>(undefined);
  readonly ext = signal<CngxAsyncState<unknown> | undefined>(undefined);
}

function mockState(): {
  state: CngxAsyncState<unknown>;
  status: ReturnType<typeof signal<AsyncStatus>>;
  error: ReturnType<typeof signal<unknown>>;
} {
  const status = signal<AsyncStatus>('idle');
  const error = signal<unknown>(undefined);
  const state = buildAsyncStateView<unknown>({
    status: status.asReadonly(),
    data: computed(() => undefined),
    error: error.asReadonly(),
    lastUpdated: computed(() => undefined),
  });
  return { state, status, error };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(configure?: (host: Host) => void) {
  const fixture = TestBed.createComponent(Host);
  configure?.(fixture.componentInstance);
  const render = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  render();
  const root = fixture.nativeElement as HTMLElement;
  const btn = root.querySelector('button') as HTMLButtonElement;
  const status: CngxActionStatus =
    fixture.debugElement.children[0].injector.get(CNGX_ACTION_STATUS);
  const outcomes: CngxActionOutcome[] = [];
  status.outcome.subscribe((o) => outcomes.push(o));
  const region = (): string => root.querySelector('[aria-live="polite"]')?.textContent ?? '';
  const active = (): string =>
    root.querySelector('.cell[data-active]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const run = async (outcome: 'success' | 'error'): Promise<void> => {
    fixture.componentInstance.actionImpl = () =>
      outcome === 'success' ? Promise.resolve() : Promise.reject('boom');
    btn.click();
    await vi.waitFor(() => {
      render();
      expect(status.status()).toBe(outcome);
    });
    render();
  };
  return {
    fixture,
    host: fixture.componentInstance,
    btn,
    status,
    outcomes,
    region,
    active,
    run,
    render,
  };
}

/** The brain without a co-hosted runner: the first read throws CNGX1082. */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testRunlessHost]',
  hostDirectives: [CngxActionStatusBrain],
  template: `<ng-content />`,
})
class TestRunlessHost {}

@Component({
  imports: [TestRunlessHost],
  template: `<button testRunlessHost>Save</button>`,
})
class RunlessHost {}

describe('CngxActionStatusBrain', () => {
  afterEach(() => {
    covered.clear();
  });

  it('throws CNGX1082 when the host lists no async run', () => {
    const fixture = TestBed.createComponent(RunlessHost);
    expect(() => fixture.detectChanges()).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX1082',
        message: expect.stringMatching(
          /^CNGX1082: \[cngxActionStatusBrain\] on <button> has no co-hosted run/,
        ),
      }),
    );
  });

  it('resolves content queries in a selector-less host directive', async () => {
    const { status, active, region, run } = setup((h) => h.templates.set(true));
    expect(status.succeededTemplate()).toBeDefined();
    expect(status.hasCell()).toEqual({ pending: true, success: true, error: true });
    await run('success');
    expect(active()).toBe('OK *');
    expect(region()).toBe('OK');
  });

  it('keeps the hasCell reference while the cells stay the same', () => {
    const { status, host, render } = setup((h) => h.succeededLabel.set('Done'));
    const first = status.hasCell();
    host.succeededLabel.set('Done again');
    render();
    expect(status.hasCell()).toBe(first);
  });

  describe('activeCell', () => {
    it('stays idle through the show delay, shows pending, holds it for the dwell', async () => {
      vi.useFakeTimers();
      const d = deferred();
      const { host, btn, status, render } = setup((h) => {
        h.pendingLabel.set('Saving');
        h.succeededLabel.set('Done');
      });
      host.actionImpl = () => d.promise;
      btn.click();
      render();
      expect(status.status()).toBe('pending');
      expect(status.activeCell()).toBe('idle');
      expect(btn.hasAttribute('data-status-label')).toBe(false);

      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.showDelay);
      render();
      expect(status.activeCell()).toBe('pending');
      expect(btn.getAttribute('data-status-label')).toBe('');

      d.resolve();
      await vi.advanceTimersByTimeAsync(0);
      render();
      expect(status.status()).toBe('success');
      expect(status.activeCell()).toBe('pending');

      await vi.advanceTimersByTimeAsync(CNGX_LOADING_DEFAULTS.minDwell);
      render();
      expect(status.activeCell()).toBe('success');
      expect(btn.getAttribute('data-status')).toBe('success');
    });

    it('marks only the active cell and hides the others from AT', async () => {
      const { fixture, run } = setup((h) => h.failedLabel.set('Failed'));
      await run('error');
      const cells = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.cell'),
      ) as HTMLElement[];
      expect(cells.map((c) => c.getAttribute('data-active'))).toEqual([null, '']);
      expect(cells.map((c) => c.getAttribute('aria-hidden'))).toEqual(['true', null]);
    });

    it('goes idle -> result with no pending cell for a fast run', async () => {
      const { status, active, run } = setup((h) => h.succeededLabel.set('Done'));
      expect(status.activeCell()).toBe('idle');
      await run('success');
      expect(active()).toBe('Done');
    });
  });

  describe('announcement precedence', () => {
    it.each([
      ['success', 'explicit', 'Saved explicitly'],
      ['error', 'explicit', 'Failed explicitly'],
      ['success', 'rendered', 'OK'],
      ['error', 'rendered', 'Err: boom'],
      ['success', 'label', 'Done'],
      ['error', 'label', 'Failed'],
      ['success', 'i18n', 'Action succeeded'],
      ['error', 'i18n', 'Action failed'],
    ] as const)('%s: %s wins', async (outcome, level, expected) => {
      const { region, run } = setup((h) => {
        if (level === 'explicit') {
          h.succeededAnnouncement.set('Saved explicitly');
          h.failedAnnouncement.set('Failed explicitly');
        }
        if (level === 'explicit' || level === 'rendered') {
          h.templates.set(true);
        }
        if (level !== 'i18n') {
          h.succeededLabel.set('Done');
          h.failedLabel.set('Failed');
        }
      });
      await run(outcome);
      expect(region()).toBe(expected);
    });

    it('derives the text from the settle, not from the status at read time', () => {
      const { status } = setup((h) => {
        h.succeededLabel.set('Done');
        h.failedLabel.set('Failed');
      });
      const settle = (generation: number, s: 'success' | 'error'): CngxAsyncSettle => ({
        generation,
        status: s,
        error: undefined,
      });
      expect(status.announcement(settle(1, 'success'))).toBe('Done');
      expect(status.announcement(settle(2, 'error'))).toBe('Failed');
      expect(status.announcement()).toBe('');
    });

    it('speaks each of two settles that land before one render', async () => {
      const { host, btn, status, outcomes, region, render } = setup((h) => {
        h.succeededLabel.set('Done');
        h.failedLabel.set('Failed');
      });
      host.actionImpl = () => Promise.resolve();
      btn.click();
      await vi.waitFor(() => expect(status.status()).toBe('success'));
      host.actionImpl = () => Promise.reject('late');
      btn.click();
      await vi.waitFor(() => expect(status.status()).toBe('error'));
      render();
      expect(outcomes.map((o) => o.status)).toEqual(['success', 'error']);
      expect(region()).toBe('Failed');
    });
  });

  describe('cover', () => {
    it('keeps the region empty for an outcome any co-hosted cover voices and speaks the uncovered one', async () => {
      covered.add('success');
      const { region, run, status } = setup((h) => {
        h.succeededLabel.set('Done');
        h.failedLabel.set('Failed');
      });
      await run('success');
      expect(region()).toBe('');
      expect(status.outcomeText('success')).toBe('Done');
      await run('error');
      expect(region()).toBe('Failed');
    });
  });

  describe('autoAnnounce', () => {
    it.each([
      [false, ''],
      [true, 'Done'],
      [undefined, 'Done'],
    ] as const)('%s speaks %j', async (auto, expected) => {
      const { region, run, status } = setup((h) => {
        h.autoAnnounce.set(auto);
        h.succeededLabel.set('Done');
      });
      await run('success');
      expect(region()).toBe(expected);
      expect(status.outcomeText('success')).toBe(expected);
    });
  });

  describe('externalState', () => {
    it('reflects external busy into externalBusy and aria-busy', () => {
      const mock = mockState();
      const { btn, status, render } = setup((h) => h.ext.set(mock.state));
      mock.status.set('pending');
      render();
      expect(status.externalBusy()).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.getAttribute('data-status')).toBe('pending');
      mock.status.set('success');
      render();
      expect(status.externalBusy()).toBe(false);
    });

    it('speaks and emits once per external edge, and idle empties the region', () => {
      const mock = mockState();
      const { status, outcomes, region, render } = setup((h) => {
        h.ext.set(mock.state);
        h.succeededLabel.set('Ext done');
        h.templates.set(true);
      });
      mock.status.set('success');
      render();
      expect(region()).toBe('OK');
      render();
      expect(outcomes).toEqual([{ status: 'success', error: undefined }]);

      mock.status.set('idle');
      render();
      expect(region()).toBe('');

      mock.error.set('ext-boom');
      mock.status.set('error');
      render();
      expect(region()).toBe('Err: ext-boom');
      expect(outcomes).toHaveLength(2);
      expect(outcomes[1]).toEqual({ status: 'error', error: 'ext-boom' });
      expect(status.state.error()).toBe('ext-boom');
    });

    it('does not treat a state already settled when bound as an edge', () => {
      const mock = mockState();
      mock.status.set('success');
      const { outcomes, region } = setup((h) => h.ext.set(mock.state));
      expect(outcomes).toHaveLength(0);
      expect(region()).toBe('');
    });

    it('does not treat binding a settled state mid-life as an edge', () => {
      const mock = mockState();
      mock.status.set('success');
      const { host, outcomes, region, render } = setup((h) => h.succeededLabel.set('Done'));
      host.ext.set(mock.state);
      render();
      render();
      expect(outcomes).toHaveLength(0);
      expect(region()).toBe('');
      // The next real edge after the bind still counts.
      mock.status.set('idle');
      render();
      mock.status.set('success');
      render();
      expect(outcomes).toHaveLength(1);
      expect(region()).toBe('Done');
    });

    it('empties the region when the external state is unbound', () => {
      const mock = mockState();
      const { host, outcomes, region, render } = setup((h) => {
        h.ext.set(mock.state);
        h.succeededLabel.set('Done');
      });
      mock.status.set('success');
      render();
      expect(region()).toBe('Done');
      host.ext.set(undefined);
      render();
      expect(region()).toBe('');
      expect(outcomes).toHaveLength(1);
    });

    it('keeps the own runs silent while an external state is bound', async () => {
      const mock = mockState();
      const { host, btn, outcomes, region, render, fixture } = setup((h) => {
        h.ext.set(mock.state);
        h.succeededLabel.set('Done');
      });
      const settles: CngxAsyncSettle[] = [];
      fixture.debugElement.children[0].injector
        .get(CngxAsyncClick)
        .settled.subscribe((s) => settles.push(s));
      host.actionImpl = () => Promise.resolve();
      btn.click();
      await vi.waitFor(() => expect(settles).toHaveLength(1));
      render();
      expect(outcomes).toHaveLength(0);
      expect(region()).toBe('');
    });
  });

  describe('outcome', () => {
    it('emits once per own settle with the error', async () => {
      const { outcomes, run } = setup();
      await run('success');
      await run('error');
      expect(outcomes).toEqual([
        { status: 'success', error: undefined },
        { status: 'error', error: 'boom' },
      ]);
    });
  });
});

describe('CngxActionStatusBrain language switch', () => {
  it('never re-voices the region on a language flip', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels(
            computed(() =>
              lang() === 'de'
                ? { asyncClickSucceeded: 'Erledigt', asyncClickFailed: 'Fehlgeschlagen' }
                : {},
            ),
          ),
        ),
      ],
    });
    const mock = mockState();
    const { region, render } = setup((h) => h.ext.set(mock.state));
    mock.status.set('success');
    render();
    expect(region()).toBe('Action succeeded');

    lang.set('de');
    render();
    expect(region()).toBe('Action succeeded');

    mock.status.set('error');
    render();
    expect(region()).toBe('Fehlgeschlagen');
  });
});
