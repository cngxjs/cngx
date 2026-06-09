import { Component, signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { describe, expect, test } from 'vitest';

import { CngxTabGroupPresenter } from '@cngx/common/tabs';

import { CngxMatTabs } from './mat-tabs.directive';
import { CngxMatTabErrorFlag } from './mat-tab-error-flag.directive';

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs, CngxMatTabErrorFlag],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One" [cngxMatTabErrorFlag]="flag()">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
    </mat-tab-group>
  `,
})
class FlagHostCmp {
  readonly flag = signal<string | boolean>(false);
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs, CngxMatTabErrorFlag],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One" cngxMatTabErrorFlag>One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
    </mat-tab-group>
  `,
})
class BareFlagHostCmp {
  protected active = 0;
}

function presenterOf(fixture: ComponentFixture<unknown>): CngxTabGroupPresenter {
  const matEl = fixture.debugElement.query(
    (el) => el.componentInstance instanceof MatTabGroup,
  );
  return matEl.injector.get(CngxTabGroupPresenter);
}

describe('CngxMatTabErrorFlag attribute directive', () => {
  test('string flag lights hasError and surfaces the message; false clears both', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FlagHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const presenter = presenterOf(fixture);
    expect(presenter.tabs()[0].hasError()).toBe(false);

    fixture.componentInstance.flag.set('Required fields missing');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].hasError()).toBe(true);
    expect(presenter.tabs()[0].errorMessage()).toBe('Required fields missing');
    expect(presenter.tabs()[1].hasError()).toBe(false);

    fixture.componentInstance.flag.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].hasError()).toBe(false);
    expect(presenter.tabs()[0].errorMessage()).toBeUndefined();
  });

  test('boolean true marks the tab invalid with no message', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FlagHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const presenter = presenterOf(fixture);
    fixture.componentInstance.flag.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].hasError()).toBe(true);
    expect(presenter.tabs()[0].errorMessage()).toBeUndefined();
  });

  test('bare attribute coerces empty string to true (presence marks invalid)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(BareFlagHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const presenter = presenterOf(fixture);
    expect(presenter.tabs()[0].hasError()).toBe(true);
    expect(presenter.tabs()[0].errorMessage()).toBeUndefined();
  });
});
