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

  describe('direct [error] input', () => {
    @Component({
      standalone: true,
      imports: [CngxStep],
      hostDirectives: [CngxStepperPresenter],
      template: `<div cngxStep [error]="error()" id="s"></div>`,
    })
    class ErrorHost {
      readonly error = signal<string | boolean>(false);
    }

    function setup(): { fixture: ReturnType<typeof TestBed.createComponent<ErrorHost>>; node: () => ReturnType<CngxStepperPresenter['flatSteps']>[number] } {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      return { fixture, node: () => presenter.flatSteps()[0] };
    }

    it('[error]="true" drives the error state with no message', () => {
      const { fixture, node } = setup();
      fixture.componentInstance.error.set(true);
      fixture.detectChanges();
      expect(node().state()).toBe('error');
      expect(node().errorMessage?.()).toBeUndefined();
    });

    it("[error]=\"'msg'\" drives the error state and exposes the message", () => {
      const { fixture, node } = setup();
      fixture.componentInstance.error.set('Card declined');
      fixture.detectChanges();
      expect(node().state()).toBe('error');
      expect(node().errorMessage?.()).toBe('Card declined');
    });

    it('[error]="false" / "" clears the error state', () => {
      const { fixture, node } = setup();
      fixture.componentInstance.error.set('Card declined');
      fixture.detectChanges();
      expect(node().state()).toBe('error');
      fixture.componentInstance.error.set('');
      fixture.detectChanges();
      expect(node().state()).toBe('idle');
      expect(node().errorMessage?.()).toBeUndefined();
      fixture.componentInstance.error.set(false);
      fixture.detectChanges();
      expect(node().state()).toBe('idle');
    });

    it('errorAggregator still drives the error state independently', () => {
      @Component({
        standalone: true,
        imports: [CngxStep],
        hostDirectives: [CngxStepperPresenter],
        template: `<div cngxStep [errorAggregator]="agg" id="s"></div>`,
      })
      class AggHost {
        readonly hasError = signal(false);
        readonly agg = {
          hasError: this.hasError,
          shouldShow: this.hasError,
          announcement: signal(''),
          errorCount: signal(0),
          errorLabels: signal([] as readonly string[]),
          activeErrors: signal([] as readonly string[]),
          addSource: () => {},
          removeSource: () => {},
        };
      }
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(AggHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
      const node = presenter.flatSteps()[0];
      expect(node.state()).toBe('idle');
      fixture.componentInstance.hasError.set(true);
      fixture.detectChanges();
      expect(node.state()).toBe('error');
    });
  });
});
