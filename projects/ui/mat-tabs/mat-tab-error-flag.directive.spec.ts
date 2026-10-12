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

describe('CngxMatTabErrorFlag header decoration', () => {
  async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function tabButtons(fixture: ComponentFixture<unknown>): HTMLElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.mat-mdc-tab'),
    );
  }

  test('a string flag badges the tab button and describes it with the message', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FlagHostCmp);
    await settle(fixture);
    const id = presenterOf(fixture).tabs()[0].id;
    const [one, two] = tabButtons(fixture);
    expect(one.classList.contains('cngx-mat-tab--has-errors')).toBe(false);
    expect(one.getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.flag.set('Required fields missing');
    await settle(fixture);

    expect(one.classList.contains('cngx-mat-tab--has-errors')).toBe(true);
    expect(one.getAttribute('aria-describedby') ?? '').toContain(`${id}-errors`);
    const span = one.querySelector(`span.cngx-sr-only[id="${id}-errors"]`);
    expect(span?.textContent).toBe('Required fields missing');
    expect(two.classList.contains('cngx-mat-tab--has-errors')).toBe(false);
  });

  test('a boolean flag falls back to the i18n error-count phrase', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FlagHostCmp);
    await settle(fixture);
    const id = presenterOf(fixture).tabs()[0].id;

    fixture.componentInstance.flag.set(true);
    await settle(fixture);

    const [one] = tabButtons(fixture);
    expect(one.classList.contains('cngx-mat-tab--has-errors')).toBe(true);
    const span = one.querySelector(`span.cngx-sr-only[id="${id}-errors"]`);
    expect(span?.textContent).toBe('1 error');
  });

  test('clearing the flag removes the badge, the descriptor and the describedby ref', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(FlagHostCmp);
    await settle(fixture);
    const id = presenterOf(fixture).tabs()[0].id;

    fixture.componentInstance.flag.set('Required fields missing');
    await settle(fixture);
    fixture.componentInstance.flag.set(false);
    await settle(fixture);

    const [one] = tabButtons(fixture);
    expect(one.classList.contains('cngx-mat-tab--has-errors')).toBe(false);
    expect(one.querySelector(`span.cngx-sr-only[id="${id}-errors"]`)).toBeNull();
    expect(one.getAttribute('aria-describedby')).toBeNull();
  });
});
