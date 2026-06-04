import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
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

describe('CngxStepGroup', () => {
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
});
