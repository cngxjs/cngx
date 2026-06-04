import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { CngxStep } from './step.directive';

@Component({
  standalone: true,
  selector: 'host-cmp',
  imports: [CngxStep],
  hostDirectives: [CngxStepperPresenter],
  template: `
    <div cngxStep label="A"></div>
    <div cngxStep label="B"></div>
  `,
})
class HostCmp {}

describe('CngxStep', () => {
  it('registers with the enclosing presenter', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    const nodes = presenter.flatSteps();
    expect(nodes.length).toBe(2);
    expect(nodes.every((n) => n.id.startsWith('cngx-step'))).toBe(true);
    expect(nodes.map((n) => n.label())).toEqual(['A', 'B']);
  });

  it('throws when no host is present', () => {
    @Component({
      standalone: true,
      imports: [CngxStep],
      template: `<div cngxStep></div>`,
    })
    class Orphan {}
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => {
      const fixture = TestBed.createComponent(Orphan);
      fixture.detectChanges();
    }).toThrowError(/no enclosing CngxStepperPresenter or CngxStepGroup/);
  });

  it('state derives from completed / disabled / errored inputs', () => {
    @Component({
      standalone: true,
      imports: [CngxStep],
      hostDirectives: [CngxStepperPresenter],
      template: `<div cngxStep [completed]="completed()" [disabled]="disabled()" id="s"></div>`,
    })
    class StateHost {
      readonly completed = signal(false);
      readonly disabled = signal(false);
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    const node = presenter.flatSteps()[0];
    expect(node.state()).toBe('idle');
    fixture.componentInstance.completed.set(true);
    fixture.detectChanges();
    expect(node.state()).toBe('success');
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(node.state()).toBe('disabled');
  });
});
