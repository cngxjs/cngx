import {
  Component,
  inject,
  signal,
  viewChild,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { describe, expect, it, vi } from 'vitest';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '../async-click/host-interaction-state.token';
import { CngxSucceeded } from '../async-click/async-status-templates';
import { CngxActionStatusBrain } from './action-status-brain.directive';
import {
  CNGX_ACTION_STATUS_CONFIG,
  makeActionStatusConfig,
  provideActionStatusConfig,
  provideActionStatusConfigAt,
  withActionStatusLabels,
  withActionStatusTemplates,
  type CngxActionStatusFailedContext,
} from './action-status-config';
import { CngxActionStatusStack } from './action-status-stack.component';
import { CNGX_ACTION_STATUS } from './action-status.token';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[testConfigHost]',
  imports: [CngxActionStatusStack],
  hostDirectives: [
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    {
      directive: CngxActionStatusBrain,
      inputs: ['pendingLabel', 'succeededLabel', 'failedLabel'],
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
  ],
  template: `<span class="labels" cngxActionStatusStack><ng-content /></span>`,
})
class TestConfigHost {}

/** Unbound labels: the config and the pack decide. */
@Component({
  imports: [TestConfigHost],
  template: `<button testConfigHost [action]="action">Save</button>`,
})
class Bare {
  outcome: 'success' | 'error' = 'success';
  readonly action = (): Promise<void> =>
    this.outcome === 'success' ? Promise.resolve() : Promise.reject('boom');
}

@Component({
  imports: [TestConfigHost],
  template: `<button testConfigHost [action]="action" succeededLabel="Instance" failedLabel="">
    Save
  </button>`,
})
class Bound {
  readonly action = (): Promise<void> => Promise.resolve();
}

@Component({
  imports: [TestConfigHost, CngxSucceeded],
  template: `<button testConfigHost [action]="action">
    Save
    <ng-template cngxSucceeded>Projected</ng-template>
  </button>`,
})
class Projected {
  readonly action = (): Promise<void> => Promise.resolve();
}

/** Owns the config templates and renders an action host once they exist. */
@Component({
  imports: [TestConfigHost],
  viewProviders: [
    {
      provide: CNGX_ACTION_STATUS_CONFIG,
      useFactory: () => {
        const owner = inject(TemplateOwner);
        return makeActionStatusConfig(
          withActionStatusTemplates({ succeeded: owner.ok(), failed: owner.failed() }),
        );
      },
    },
  ],
  template: `
    <ng-template #ok>Config ok</ng-template>
    <ng-template #failed let-err>Config err: {{ err }}</ng-template>
    @if (ready()) {
      <button testConfigHost [action]="action">Save</button>
    }
  `,
})
class TemplateOwner {
  outcome: 'success' | 'error' = 'success';
  readonly ready = signal(false);
  readonly ok = viewChild.required<TemplateRef<unknown>>('ok');
  readonly failed = viewChild.required<TemplateRef<CngxActionStatusFailedContext>>('failed');
  readonly action = (): Promise<void> =>
    this.outcome === 'success' ? Promise.resolve() : Promise.reject('boom');
}

/** Config templates for both result cells, but the instance binds its own labels. */
@Component({
  imports: [TestConfigHost],
  viewProviders: [
    {
      provide: CNGX_ACTION_STATUS_CONFIG,
      useFactory: () => {
        const owner = inject(BoundOverTemplates);
        return { templates: { succeeded: owner.ok(), failed: owner.failed() } };
      },
    },
  ],
  template: `
    <ng-template #ok>Config ok</ng-template>
    <ng-template #failed>Config err</ng-template>
    @if (ready()) {
      <button testConfigHost [action]="action" succeededLabel="Instance" failedLabel="">
        Save
      </button>
    }
  `,
})
class BoundOverTemplates {
  readonly ready = signal(false);
  readonly ok = viewChild.required<TemplateRef<unknown>>('ok');
  readonly failed = viewChild.required<TemplateRef<CngxActionStatusFailedContext>>('failed');
  readonly action = (): Promise<void> => Promise.resolve();
}

@Component({
  imports: [TestConfigHost],
  viewProviders: [provideActionStatusConfigAt(withActionStatusLabels({ failed: 'Scoped failed' }))],
  template: `<button testConfigHost [action]="action">Save</button>`,
})
class Scoped {
  readonly action = (): Promise<void> => Promise.resolve();
}

function render<T>(type: new () => T, providers: (Provider | EnvironmentProviders)[] = []) {
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(type);
  const flush = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  flush();
  const root = fixture.nativeElement as HTMLElement;
  const cells = (): HTMLElement[] =>
    Array.from(root.querySelector('.labels')?.children ?? []) as HTMLElement[];
  const cell = (kind: string): string | undefined =>
    cells()
      .find((c) => c.getAttribute('cngxActionStatusCell') === kind)
      ?.textContent?.trim();
  const active = (): string =>
    cells()
      .find((c) => c.hasAttribute('data-active'))
      ?.textContent?.trim() ?? '';
  const click = (): void => (root.querySelector('button') as HTMLButtonElement).click();
  return { fixture, cells, cell, active, click, flush };
}

describe('CNGX_ACTION_STATUS_CONFIG', () => {
  it('renders no extra cell without a label anywhere (the English pack is empty)', () => {
    const { cells } = render(Bare);
    expect(cells().map((c) => c.getAttribute('cngxActionStatusCell'))).toEqual(['idle']);
  });

  it('turns the cells on from app-wide labels', () => {
    const { cell } = render(Bare, [
      provideActionStatusConfig(
        withActionStatusLabels({ pending: 'Working', succeeded: 'Done', failed: 'Failed' }),
      ),
    ]);
    expect(cell('pending')).toBe('Working');
    expect(cell('success')).toBe('Done');
    expect(cell('error')).toBe('Failed');
  });

  it('follows a Signal of labels', () => {
    const labels = signal<{ succeeded?: string }>({ succeeded: 'Done' });
    const { cell, flush } = render(Bare, [
      provideActionStatusConfig(withActionStatusLabels(labels)),
    ]);
    expect(cell('success')).toBe('Done');
    labels.set({ succeeded: 'Erledigt' });
    flush();
    expect(cell('success')).toBe('Erledigt');
  });

  it('lets a bound label win and a bound empty label switch its cell off', () => {
    const { cell } = render(Bound, [
      provideActionStatusConfig(
        withActionStatusLabels({ succeeded: 'Config', failed: 'Config failed' }),
      ),
    ]);
    expect(cell('success')).toBe('Instance');
    expect(cell('error')).toBeUndefined();
  });

  it('reads the actionStatus section of the language pack under the config', () => {
    const { cell } = render(Bare, [
      provideCngxI18n(
        withPartialPack({ locale: 'de', actionStatus: { succeeded: 'Gespeichert' } }),
        withDocumentLanguage('off'),
      ),
    ]);
    expect(cell('success')).toBe('Gespeichert');
    expect(cell('pending')).toBeUndefined();
  });

  it('speaks the config label when no result cell text is rendered first', async () => {
    const { click, active, flush } = render(Bare, [
      provideActionStatusConfig(withActionStatusLabels({ succeeded: 'Done' })),
    ]);
    click();
    await vi.waitFor(() => {
      flush();
      expect(active()).toBe('Done');
    });
  });

  it('merges a scoped config over the parent one', () => {
    const { cell } = render(Scoped, [
      provideActionStatusConfig(withActionStatusLabels({ succeeded: 'Root done' })),
    ]);
    expect(cell('error')).toBe('Scoped failed');
    expect(cell('success')).toBe('Root done');
  });

  it('merges labels per key across features of one provider', () => {
    const { cell } = render(Bare, [
      provideActionStatusConfig(
        withActionStatusLabels({ succeeded: 'Done' }),
        withActionStatusLabels({ failed: 'Failed' }),
      ),
    ]);
    expect(cell('success')).toBe('Done');
    expect(cell('error')).toBe('Failed');
  });

  it('lets a projected template win over a config template', () => {
    const tpl = {} as TemplateRef<unknown>;
    const { cell } = render(Projected, [
      provideActionStatusConfig(withActionStatusTemplates({ succeeded: tpl })),
    ]);
    expect(cell('success')).toBe('Projected');
  });

  it('renders a config template when none is projected', async () => {
    const { fixture, click, active, flush } = render(TemplateOwner);
    fixture.componentInstance.ready.set(true);
    flush();
    click();
    await vi.waitFor(() => {
      flush();
      expect(active()).toBe('Config ok');
    });
  });

  it('lets a bound label win over a config template and a bound empty label switch it off', () => {
    const { fixture, cell, flush } = render(BoundOverTemplates);
    fixture.componentInstance.ready.set(true);
    flush();
    expect(cell('success')).toBe('Instance');
    expect(cell('error')).toBeUndefined();
  });

  it('hands the error to the config failed template as $implicit', async () => {
    const { fixture, click, active, flush } = render(TemplateOwner);
    fixture.componentInstance.outcome = 'error';
    fixture.componentInstance.ready.set(true);
    flush();
    click();
    await vi.waitFor(() => {
      flush();
      expect(active()).toBe('Config err: boom');
    });
  });
});
