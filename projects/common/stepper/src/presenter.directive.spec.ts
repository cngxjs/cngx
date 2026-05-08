import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { Subject, of, throwError } from 'rxjs';

import { CngxStepperPresenter } from './presenter.directive';
import { provideStepperConfig, withStepperDefaultOrientation, withStepperLinear } from './stepper-config';
import type { CngxStepRegistration, CngxStepStatus } from './stepper-host.token';

function reg(id: string, kind: 'step' | 'group' = 'step', stateValue: CngxStepStatus = 'idle', disabled = false): CngxStepRegistration {
  return {
    id,
    kind,
    label: signal(id),
    disabled: signal(disabled),
    state: signal(stateValue),
  };
}

@Component({
  standalone: true,
  selector: 'host-cmp',
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['linear', 'orientation'],
    },
  ],
  template: '',
})
class HostCmp {}

function setup(): { presenter: CngxStepperPresenter } {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
  return { presenter };
}

describe('CngxStepperPresenter', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts with empty tree, activeStepIndex=0, activeStepId=null', () => {
    const { presenter } = setup();
    expect(presenter.stepTree().length).toBe(0);
    expect(presenter.flatSteps().length).toBe(0);
    expect(presenter.activeStepIndex()).toBe(0);
    expect(presenter.activeStepId()).toBeNull();
  });

  it('register builds a flat tree of root steps', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.register(reg('c'));
    expect(presenter.flatSteps().map((n) => n.id)).toEqual(['a', 'b', 'c']);
    expect(presenter.activeStepId()).toBe('a');
  });

  it('register supports nested groups via parentId', () => {
    const { presenter } = setup();
    presenter.register(reg('g', 'group'));
    presenter.register(reg('a'), 'g');
    presenter.register(reg('b'), 'g');
    const ids = presenter.flatSteps().map((n) => n.id);
    expect(ids).toEqual(['g', 'a', 'b']);
    // Step-only filter for activeStepIndex resolution skips 'g'.
    expect(presenter.activeStepId()).toBe('a');
  });

  it('select clamps the index against step-only count', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.select(99);
    expect(presenter.activeStepIndex()).toBe(1);
    presenter.select(-5);
    expect(presenter.activeStepIndex()).toBe(0);
  });

  it('selectNext / selectPrevious skip disabled steps', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b', 'step', 'idle', true));
    presenter.register(reg('c'));
    presenter.selectNext();
    expect(presenter.activeStepId()).toBe('c');
    presenter.selectPrevious();
    expect(presenter.activeStepId()).toBe('a');
  });

  it('selectById resolves an id to its step-only index', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.register(reg('c'));
    presenter.selectById('b');
    expect(presenter.activeStepIndex()).toBe(1);
  });

  it('linear mode refuses jumps over incomplete steps', () => {
    // Fresh fixture with linear=true.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    @Component({
      standalone: true,
      selector: 'linear-host',
      hostDirectives: [{ directive: CngxStepperPresenter, inputs: ['linear'] }],
      template: '',
    })
    class LinearHost {}
    const fixture = TestBed.createComponent(LinearHost);
    fixture.componentRef.setInput('linear', true);
    fixture.detectChanges();
    const p = fixture.debugElement.injector.get(CngxStepperPresenter);
    p.register(reg('a', 'step', 'idle')); // not yet success
    p.register(reg('b'));
    p.register(reg('c'));
    p.select(2);
    // Linear mode should refuse the jump because a/b are not 'success'.
    expect(p.activeStepIndex()).toBe(0);
  });

  it('reset returns activeStepIndex to 0', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.select(1);
    expect(presenter.activeStepIndex()).toBe(1);
    presenter.reset();
    expect(presenter.activeStepIndex()).toBe(0);
  });

  it('flatSteps applies stepTreeEqual short-circuit on identical re-emissions', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    const before = presenter.flatSteps();
    presenter.register(reg('a')); // idempotent re-register
    const after = presenter.flatSteps();
    // Same shape → structural-equal short-circuit keeps the same
    // signal reference for downstream consumers.
    expect(after).toBe(before);
  });

  it('unregister removes a step from the tree', () => {
    const { presenter } = setup();
    presenter.register(reg('a'));
    presenter.register(reg('b'));
    presenter.unregister('a');
    expect(presenter.flatSteps().map((n) => n.id)).toEqual(['b']);
  });

  it('exposes commitState as part of the CNGX_STATEFUL contract', () => {
    const { presenter } = setup();
    expect(presenter.commitState.status()).toBe('idle');
    expect(presenter.state).toBe(presenter.commitState);
  });

  it('linear / orientation / commitMode resolve from CNGX_STEPPER_CONFIG when input is unset', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperDefaultOrientation('vertical'),
          withStepperLinear(true),
        ),
      ],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    expect(presenter.linear()).toBe(true);
    expect(presenter.orientation()).toBe('vertical');
  });

  describe('commit-action lifecycle', () => {
    function commitFixture(
      mode: 'optimistic' | 'pessimistic',
      action: (from: number, to: number) => unknown,
    ): { presenter: CngxStepperPresenter } {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        hostDirectives: [
          {
            directive: CngxStepperPresenter,
            inputs: ['commitAction', 'commitMode'],
          },
        ],
        template: '',
      })
      class CommitHost {}
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentRef.setInput('commitAction', action);
      fixture.componentRef.setInput('commitMode', mode);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      presenter.register(reg('a'));
      presenter.register(reg('b'));
      presenter.register(reg('c'));
      return { presenter };
    }

    it('pessimistic + sync success: advances on resolution', () => {
      const { presenter } = commitFixture('pessimistic', () => true);
      expect(presenter.activeStepIndex()).toBe(0);
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(2);
    });

    it('pessimistic + sync rejection: stays on origin', () => {
      const { presenter } = commitFixture('pessimistic', () => false);
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(0);
    });

    it('optimistic + sync rejection: rolls back to origin', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(0);
    });

    it('optimistic + Observable success: advances', () => {
      const { presenter } = commitFixture('optimistic', () => of(true));
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(2);
    });

    it('error path: rejects via thrown observable + rolls back in optimistic', () => {
      const { presenter } = commitFixture('optimistic', () =>
        throwError(() => new Error('refused')),
      );
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(0);
    });

    it('supersede: rapid second select cancels the first commit', () => {
      // The first action never resolves (Subject); the second
      // action resolves true. Supersede semantics from the lifted
      // controller mean the first never advances; only the second's
      // outcome lands.
      const subj = new Subject<boolean>();
      let toggle = 0;
      const { presenter } = commitFixture('pessimistic', (_from, to) => {
        if (toggle === 0) {
          toggle = 1;
          return subj;
        }
        return to === 1 ? true : false;
      });
      presenter.select(2);
      expect(presenter.activeStepIndex()).toBe(0); // first in flight
      presenter.select(1); // supersedes
      expect(presenter.activeStepIndex()).toBe(1); // second resolved synchronously
      // First subject's late emit must be ignored.
      subj.next(true);
      subj.complete();
      expect(presenter.activeStepIndex()).toBe(1);
    });

    it('commitTransition tracks pending → success on resolved commit', () => {
      const { presenter } = commitFixture('pessimistic', () => true);
      expect(presenter.commitTransition.current()).toBe('idle');
      presenter.select(2);
      // Sync resolution collapses pending → success in one tick;
      // tracker captures the transition's terminal status.
      expect(presenter.commitTransition.current()).toBe('success');
    });

    it('commitTransition tracks pending → error on rejected commit', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      presenter.select(2);
      expect(presenter.commitTransition.current()).toBe('error');
    });

    it('lastFailedIndex flags the refused target on rejection', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      expect(presenter.lastFailedIndex()).toBeUndefined();
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBe(2);
    });

    it('originIndexDuringCommit captures the origin on commit-window open', () => {
      // Pending Subject keeps the window open; origin must be the
      // active index at commit time, captured exactly once.
      const subj = new Subject<boolean>();
      const { presenter } = commitFixture('pessimistic', () => subj);
      expect(presenter.originIndexDuringCommit()).toBeUndefined();
      presenter.select(2);
      expect(presenter.originIndexDuringCommit()).toBe(0);
      // On success, origin clears (window closes).
      subj.next(true);
      subj.complete();
      expect(presenter.originIndexDuringCommit()).toBeUndefined();
    });

    it('originIndexDuringCommit is RETAINED on rejection (rich rollback derivable)', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      presenter.select(2);
      // Reject keeps origin so liveAnnouncement can resolve the label.
      expect(presenter.lastFailedIndex()).toBe(2);
      expect(presenter.originIndexDuringCommit()).toBe(0);
    });

    it('clearLastFailed() zeros lastFailedIndex but leaves origin slot alone', () => {
      const { presenter } = commitFixture('optimistic', () => false);
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBe(2);
      const originBefore = presenter.originIndexDuringCommit();
      presenter.clearLastFailed();
      expect(presenter.lastFailedIndex()).toBeUndefined();
      // Origin slot is independent — clearLastFailed does not touch it.
      expect(presenter.originIndexDuringCommit()).toBe(originBefore);
    });

    it('successful re-pick of the failed target clears lastFailedIndex', () => {
      // First select rejects; second select on the same index resolves
      // true. The successful arm clears lastFailedIndex when the
      // resolved target matches the previously-failed target.
      let attempt = 0;
      const { presenter } = commitFixture('optimistic', () => {
        attempt++;
        return attempt === 1 ? false : true;
      });
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBe(2);
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBeUndefined();
    });

    it('no-action fast path clears lastFailedIndex when re-picking the failed target', () => {
      // Reject first via commit-action, then unbind the action and
      // re-pick — the no-action fast path must still close the
      // rejection state per Pillar 2 (every state change communicates).
      let action: (() => boolean) | null = () => false;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        hostDirectives: [
          {
            directive: CngxStepperPresenter,
            inputs: ['commitAction', 'commitMode'],
          },
        ],
        template: '',
      })
      class FastPathHost {}
      const fixture = TestBed.createComponent(FastPathHost);
      fixture.componentRef.setInput('commitAction', action);
      fixture.componentRef.setInput('commitMode', 'optimistic');
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      presenter.register(reg('a'));
      presenter.register(reg('b'));
      presenter.register(reg('c'));
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBe(2);
      action = null;
      fixture.componentRef.setInput('commitAction', action);
      fixture.detectChanges();
      presenter.select(2);
      expect(presenter.lastFailedIndex()).toBeUndefined();
    });
  });

  it('per-instance Input wins over the config default', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withStepperDefaultOrientation('vertical')),
      ],
    });
    @Component({
      standalone: true,
      hostDirectives: [
        { directive: CngxStepperPresenter, inputs: ['orientation'] },
      ],
      template: '',
    })
    class InputWinsHost {}
    const fixture = TestBed.createComponent(InputWinsHost);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    const p = fixture.debugElement.injector.get(CngxStepperPresenter);
    // Input='horizontal' wins over config default='vertical'.
    expect(p.orientation()).toBe('horizontal');
  });
});
