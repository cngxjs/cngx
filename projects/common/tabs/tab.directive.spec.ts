import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxTabGroupPresenter } from './presenter.directive';
import type { CngxTabHandle } from './tab-group-host.token';
import { CngxTab } from './tab.directive';
import { CngxTabLabel } from './tab-label.directive';
import { CngxTabSubLabel } from './slots/tab-sub-label.directive';
import { CngxTabContent } from './tab-content.directive';

@Component({
  standalone: true,
  selector: 'tab-host',
  imports: [CngxTab, CngxTabLabel, CngxTabContent],
  hostDirectives: [CngxTabGroupPresenter],
  template: `
    <div cngxTab [disabled]="aDisabled()" [label]="'A'">
      <ng-template cngxTabLabel>A label</ng-template>
      <ng-template cngxTabContent>A content</ng-template>
    </div>
    <div cngxTab [label]="'B'">
      <ng-template cngxTabLabel>B label</ng-template>
      <ng-template cngxTabContent>B content</ng-template>
    </div>
  `,
})
class TabHost {
  readonly aDisabled = signal(false);
}

@Component({
  standalone: true,
  selector: 'orphan-tab',
  imports: [CngxTab],
  template: '<div cngxTab></div>',
})
class OrphanTab {}

describe('CngxTab', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('registers with the presenter on construction', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const tabs = presenter.tabs();
    expect(tabs.length).toBe(2);
    expect(tabs.every((t) => t.id.startsWith('cngx-tab-'))).toBe(true);
    expect(tabs.map((t) => t.label())).toEqual(['A', 'B']);
  });

  it('unregisters via DestroyRef when destroyed', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    fixture.destroy();
    expect(presenter.tabs().length).toBe(0);
  });

  it('selected mirrors presenter.activeId', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const tabEls = fixture.debugElement.queryAll(By.directive(CngxTab));
    const tabA = tabEls[0].injector.get(CngxTab);
    const tabB = tabEls[1].injector.get(CngxTab);
    expect(tabA.selected()).toBe(true);
    expect(tabB.selected()).toBe(false);
    presenter.select(1);
    fixture.detectChanges();
    expect(tabA.selected()).toBe(false);
    expect(tabB.selected()).toBe(true);
  });

  it('discovers projected cngxTabLabel + cngxTabContent slots', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const tab = fixture.debugElement
      .queryAll(By.directive(CngxTab))[0]
      .injector.get(CngxTab);
    expect(tab.labelTemplate()).toBeTruthy();
    expect(tab.contentTemplate()).toBeTruthy();
  });

  it('auto-generated ids are unique per instance', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    const ids = presenter.tabs().map((t) => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('a dynamically-bound [id] reaches the registered handle (not the auto-id)', () => {
    @Component({
      standalone: true,
      selector: 'bound-id-host',
      imports: [CngxTab],
      hostDirectives: [CngxTabGroupPresenter],
      template: `
        <div cngxTab [id]="dynId()" [label]="'A'"></div>
        <div cngxTab id="static-b" [label]="'B'"></div>
      `,
    })
    class BoundIdHost {
      readonly dynId = signal('doc-1');
    }
    const fixture = TestBed.createComponent(BoundIdHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs().map((t) => t.id)).toEqual(['doc-1', 'static-b']);
  });

  it('throws a clear dev-mode error when no presenter is on the ancestor', () => {
    expect(() => {
      const fixture = TestBed.createComponent(OrphanTab);
      fixture.detectChanges();
    }).toThrow(/no enclosing CngxTabGroupPresenter/);
  });

  it('disabled flag flows through to the registered handle', () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs()[0].disabled()).toBe(false);
    fixture.componentInstance.aDisabled.set(true);
    fixture.detectChanges();
    expect(presenter.tabs()[0].disabled()).toBe(true);
  });

  it('[subLabel] flows through to the registered handle', () => {
    @Component({
      standalone: true,
      selector: 'sub-label-host',
      imports: [CngxTab],
      hostDirectives: [CngxTabGroupPresenter],
      template: `<div cngxTab [label]="'A'" [subLabel]="detail()"></div>`,
    })
    class SubLabelHost {
      readonly detail = signal<string | undefined>('45 saved');
    }
    const fixture = TestBed.createComponent(SubLabelHost);
    fixture.detectChanges();
    const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs()[0].subLabel()).toBe('45 saved');
    fixture.componentInstance.detail.set('46 saved');
    fixture.detectChanges();
    expect(presenter.tabs()[0].subLabel()).toBe('46 saved');
  });

  describe('direct [error] input', () => {
    @Component({
      standalone: true,
      selector: 'error-host',
      imports: [CngxTab],
      hostDirectives: [CngxTabGroupPresenter],
      template: `<div cngxTab [label]="'A'" [error]="error()"></div>`,
    })
    class ErrorHost {
      readonly error = signal<string | boolean>(false);
    }

    function setup(): {
      fixture: ReturnType<typeof TestBed.createComponent<ErrorHost>>;
      handle: () => CngxTabHandle;
    } {
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
      return { fixture, handle: () => presenter.tabs()[0] };
    }

    it('defaults to no error and no message', () => {
      const { handle } = setup();
      expect(handle().hasError()).toBe(false);
      expect(handle().errorMessage()).toBeUndefined();
    });

    it('[error]="true" sets hasError with no message', () => {
      const { fixture, handle } = setup();
      fixture.componentInstance.error.set(true);
      fixture.detectChanges();
      expect(handle().hasError()).toBe(true);
      expect(handle().errorMessage()).toBeUndefined();
    });

    it("[error]=\"'msg'\" sets hasError and exposes the message", () => {
      const { fixture, handle } = setup();
      fixture.componentInstance.error.set('Required fields missing');
      fixture.detectChanges();
      expect(handle().hasError()).toBe(true);
      expect(handle().errorMessage()).toBe('Required fields missing');
    });

    it('[error]="false" / "" clears hasError and message', () => {
      const { fixture, handle } = setup();
      fixture.componentInstance.error.set('Required fields missing');
      fixture.detectChanges();
      expect(handle().hasError()).toBe(true);
      fixture.componentInstance.error.set('');
      fixture.detectChanges();
      expect(handle().hasError()).toBe(false);
      expect(handle().errorMessage()).toBeUndefined();
      fixture.componentInstance.error.set(false);
      fixture.detectChanges();
      expect(handle().hasError()).toBe(false);
    });

    it('hasError folds the aggregator independently of the direct flag', () => {
      @Component({
        standalone: true,
        selector: 'agg-host',
        imports: [CngxTab],
        hostDirectives: [CngxTabGroupPresenter],
        template: `<div cngxTab [label]="'A'" [errorAggregator]="agg"></div>`,
      })
      class AggHost {
        readonly aggHasError = signal(false);
        readonly agg = {
          hasError: this.aggHasError,
          shouldShow: this.aggHasError,
          announcement: signal(''),
          errorCount: signal(0),
          errorLabels: signal([] as readonly string[]),
          activeErrors: signal([] as readonly string[]),
          addSource: () => {},
          removeSource: () => {},
        };
      }
      const fixture = TestBed.createComponent(AggHost);
      fixture.detectChanges();
      const presenter = fixture.debugElement.injector.get(CngxTabGroupPresenter);
      const handle = presenter.tabs()[0];
      expect(handle.hasError()).toBe(false);
      fixture.componentInstance.aggHasError.set(true);
      fixture.detectChanges();
      expect(handle.hasError()).toBe(true);
      expect(handle.errorMessage()).toBeUndefined();
    });
  });

  it('subLabel defaults to undefined and discovers a projected cngxTabSubLabel slot', () => {
    @Component({
      standalone: true,
      selector: 'sub-label-slot-host',
      imports: [CngxTab, CngxTabSubLabel],
      hostDirectives: [CngxTabGroupPresenter],
      template: `
        <div cngxTab [label]="'A'">
          <ng-template cngxTabSubLabel>detail</ng-template>
        </div>
        <div cngxTab [label]="'B'"></div>
      `,
    })
    class SubLabelSlotHost {}
    const fixture = TestBed.createComponent(SubLabelSlotHost);
    fixture.detectChanges();
    const tabs = fixture.debugElement.queryAll(By.directive(CngxTab));
    const tabA = tabs[0].injector.get(CngxTab);
    const tabB = tabs[1].injector.get(CngxTab);
    expect(tabA.subLabelTemplate()).toBeTruthy();
    expect(tabB.subLabelTemplate()).toBeFalsy();
    expect(tabB.subLabel()).toBeUndefined();
  });
});
