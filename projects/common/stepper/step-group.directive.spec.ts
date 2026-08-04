import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { provideStepperConfig, withStepperGroupCollapse } from './stepper-config';
import { CngxStep } from './step.directive';
import { CngxStepGroup } from './step-group.directive';

@Component({
  standalone: true,
  selector: 'host-cmp',
  imports: [CngxStep, CngxStepGroup],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <div cngxStepGroup label="Group 1">
      <div cngxStep label="A"></div>
      <div cngxStep label="B"></div>
    </div>
    <div cngxStep label="Trailing"></div>
  `,
})
class GroupHost {}

@Component({
  standalone: true,
  selector: 'two-group-host',
  imports: [CngxStep, CngxStepGroup],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <div cngxStepGroup label="Account">
      <div cngxStep label="A"></div>
    </div>
    <div cngxStepGroup label="Project">
      <div cngxStep label="B"></div>
    </div>
  `,
})
class TwoGroupHost {}

@Component({
  standalone: true,
  selector: 'custom-id-host',
  imports: [CngxStep, CngxStepGroup],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <div cngxStep id="intro" label="Intro"></div>
    <div cngxStepGroup id="account" label="Account">
      <div cngxStep id="email" label="Email"></div>
      <div cngxStep id="password" label="Password"></div>
    </div>
    <div cngxStep id="finish" label="Finish"></div>
  `,
})
class CustomIdHost {}

// Keyed by label() (stable post-detectChanges). The group's own id is an
// auto-generated nextUid - the realistic grouped-stepper pattern, where
// the registration id and this.id() agree at every read.
function groupsOf(fixture: { debugElement: import('@angular/core').DebugElement }): Map<string, CngxStepGroup> {
  const map = new Map<string, CngxStepGroup>();
  for (const de of fixture.debugElement.queryAll(By.directive(CngxStepGroup))) {
    const g = de.injector.get(CngxStepGroup);
    map.set(g.label(), g);
  }
  return map;
}

describe('CngxStepGroup', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('builds a hierarchical tree with the group + nested steps + trailing root step', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(GroupHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    const flat = presenter.flatSteps();
    expect(flat.length).toBe(4);
    const labels = flat.map((n) => n.label());
    expect(labels).toEqual(['Group 1', 'A', 'B', 'Trailing']);
    const group = flat.find((n) => n.kind === 'group')!;
    expect(group.children.length).toBe(2);
  });

  it('registers bound [id] values (not auto-ids) in DOM order across groups', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CustomIdHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);

    // ngOnInit registration applies the bound `[id]`; the constructor read
    // captured the auto-uid. DOM order is preserved: root steps around the
    // group, nested steps inside it.
    expect(presenter.stepsOnly().map((n) => n.id)).toEqual([
      'intro',
      'email',
      'password',
      'finish',
    ]);
    expect(presenter.stepTree().map((n) => n.id)).toEqual(['intro', 'account', 'finish']);

    // The registered id is now the deep-link key: selectById resolves it.
    presenter.selectById('password');
    expect(presenter.activeStepId()).toBe('password');
  });

  describe('isCollapsed (focus-driven group collapse)', () => {
    it('collapses non-active groups and expands the active one under expand-active', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperGroupCollapse('expand-active')),
        ],
      });
      const fixture = TestBed.createComponent(TwoGroupHost);
      fixture.detectChanges();
      const groups = groupsOf(fixture);
      // Active step-only index 0 = 'A' under 'account'.
      expect(groups.get('Account')!.isCollapsed()).toBe(false);
      expect(groups.get('Project')!.isCollapsed()).toBe(true);
    });

    it('is always false under the off baseline', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(TwoGroupHost);
      fixture.detectChanges();
      const groups = groupsOf(fixture);
      expect(groups.get('Account')!.isCollapsed()).toBe(false);
      expect(groups.get('Project')!.isCollapsed()).toBe(false);
    });

    it('tracks the active group reactively across selection', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperGroupCollapse('expand-active')),
        ],
      });
      const fixture = TestBed.createComponent(TwoGroupHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      const groups = groupsOf(fixture);
      // Step-only index 1 = 'B' under 'project'.
      presenter.select(1);
      expect(groups.get('Account')!.isCollapsed()).toBe(true);
      expect(groups.get('Project')!.isCollapsed()).toBe(false);
    });
  });
});
