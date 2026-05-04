import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { CngxStep, CngxStepGroup } from '@cngx/common/stepper';

import { CngxStepper } from './stepper.component';

@Component({
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <cngx-stepper aria-label="Wizard">
      <div cngxStep label="A"></div>
      <div cngxStep label="B"></div>
      <div cngxStep label="C"></div>
    </cngx-stepper>
  `,
})
class HostCmp {}

@Component({
  standalone: true,
  imports: [CngxStepper, CngxStep, CngxStepGroup],
  template: `
    <cngx-stepper aria-label="Hierarchical">
      <div cngxStepGroup label="Group">
        <div cngxStep label="A"></div>
        <div cngxStep label="B"></div>
      </div>
      <div cngxStep label="Trailing"></div>
    </cngx-stepper>
  `,
})
class HierarchicalHost {}

describe('CngxStepper organism', () => {
  it('host carries role="group" + aria-roledescription="stepper" + data-orientation', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-roledescription')).toBe('stepper');
    expect(host.getAttribute('data-orientation')).toBe('horizontal');
    expect(host.getAttribute('aria-label')).toBe('Wizard');
  });

  it('renders one strip button per registered step', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
  });

  it('first step carries aria-current="step", others do not', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].getAttribute('aria-current')).toBe('step');
    expect(buttons[1].getAttribute('aria-current')).toBeNull();
    expect(buttons[2].getAttribute('aria-current')).toBeNull();
  });

  it('click on second step advances aria-current', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
    expect(buttons[1].getAttribute('aria-current')).toBe('step');
  });

  it('aria-controls on a step references the panel id with role="region"', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button.cngx-stepper__step',
    ) as HTMLButtonElement;
    const panelId = button.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = fixture.nativeElement.querySelector(
      `#${panelId}`,
    ) as HTMLElement;
    expect(panel?.getAttribute('role')).toBe('region');
    expect(panel?.getAttribute('aria-labelledby')).toBe(button.id);
  });

  it('hierarchical: group renders with role="group" + aria-roledescription="step group"', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HierarchicalHost);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.cngx-stepper__group-header',
    ) as HTMLElement;
    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-roledescription')).toBe('step group');
    // 3 step buttons: A, B (children of group), Trailing.
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(3);
  });

  it('non-active panels are hidden via [hidden]', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const panels = fixture.nativeElement.querySelectorAll(
      '.cngx-stepper__panel',
    ) as NodeListOf<HTMLElement>;
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    expect(panels[2].hidden).toBe(true);
  });

  it('hierarchical: group header carries data-step-depth=0 + sub-step buttons depth=1', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HierarchicalHost);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.cngx-stepper__group-header',
    ) as HTMLElement;
    expect(group.getAttribute('data-step-depth')).toBe('0');
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    // First two buttons are sub-steps of the group → depth=1.
    expect(buttons[0].getAttribute('data-step-depth')).toBe('1');
    expect(buttons[1].getAttribute('data-step-depth')).toBe('1');
    // Trailing root step → depth=0.
    expect(buttons[2].getAttribute('data-step-depth')).toBe('0');
  });

  it('error-aggregator badge shows when [errorAggregator]?.shouldShow() is true', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper aria-label="Errors">
          <div cngxStep label="A" [errorAggregator]="agg"></div>
          <div cngxStep label="B"></div>
        </cngx-stepper>
      `,
    })
    class ErrHost {
      readonly aggShow = signal(false);
      readonly agg = {
        hasError: this.aggShow,
        shouldShow: this.aggShow,
        announcement: signal('Two validation errors'),
        errorCount: signal(2),
        errorLabels: signal(['email', 'phone'] as readonly string[]),
        activeErrors: signal(['email', 'phone'] as readonly string[]),
        addSource: () => {},
        removeSource: () => {},
      };
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ErrHost);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.cngx-stepper__badge').length,
    ).toBe(0);
    fixture.componentInstance.aggShow.set(true);
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll(
      '.cngx-stepper__badge',
    ) as NodeListOf<HTMLElement>;
    expect(badges.length).toBe(1);
    expect(badges[0].getAttribute('aria-hidden')).toBe('true');
  });

  it('descriptor span carries the i18n "Step N of M: <label>" phrase', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button.cngx-stepper__step',
    ) as HTMLButtonElement;
    const descId = button.getAttribute('aria-describedby')!;
    const desc = fixture.nativeElement.querySelector(
      `#${descId}`,
    ) as HTMLElement;
    expect(desc.textContent?.trim()).toBe('Step 1 of 3: A');
  });
});
