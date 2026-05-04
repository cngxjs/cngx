import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { provideStepperConfig, withDefaultOrientation, withStepperLinear } from './stepper-config';
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
          withDefaultOrientation('vertical'),
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

  it('per-instance Input wins over the config default', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withDefaultOrientation('vertical')),
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
