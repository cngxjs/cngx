import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CngxStep,
  CngxStepGroup,
  type CngxStepperCommitAction,
  CNGX_STEPPER_GLYPHS,
  provideStepperConfig,
  provideStepperI18n,
  withStepperAriaLabels,
  withStepperFallbackLabels,
  CngxStepError,
  withStepperDensity,
  withStepperGroupCollapse,
  withStepperGroupCollapseSummary,
  withStepperHeaderNavigation,
  withStepperI18nLabels,
  withStepperMobileSwipe,
  withStepperSkin,
} from '@cngx/common/stepper';

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

@Component({
  standalone: true,
  imports: [CngxStepper, CngxStep, CngxStepGroup],
  template: `
    <cngx-stepper aria-label="Collapse">
      <div cngxStepGroup label="Account">
        <div cngxStep label="A"></div>
        <div cngxStep label="B"></div>
      </div>
      <div cngxStepGroup label="Project">
        <div cngxStep label="C"></div>
        <div cngxStep label="D"></div>
      </div>
      <div cngxStep label="Finish"></div>
    </cngx-stepper>
  `,
})
class CollapseHost {}

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

  it('host carries data-skin="classic" by default', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('data-skin')).toBe('classic');
  });

  it('provideStepperConfig(withStepperSkin) moves the default skin', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withStepperSkin('linear-minimal')),
      ],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('data-skin')).toBe('linear-minimal');
  });

  it('per-instance [skin] input wins over the root config', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper aria-label="Wizard" skin="path-chevron">
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
        </cngx-stepper>
      `,
    })
    class SkinInputHost {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withStepperSkin('linear-minimal')),
      ],
    });
    const fixture = TestBed.createComponent(SkinInputHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('data-skin')).toBe('path-chevron');
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

  it('scrolls the active step button into view when activeStepId changes', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const calls: HTMLButtonElement[] = [];
    for (const btn of buttons) {
      Object.defineProperty(btn, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: () => calls.push(btn),
      });
    }
    buttons[2].click();
    fixture.detectChanges();
    expect(calls).toContain(buttons[2]);
  });

  it('panel carries aria-describedby pointing at the step descriptor span (always-rendered)', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      '.cngx-stepper__panel',
    ) as HTMLElement;
    const descId = panel.getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    // Descriptor span lives in the step button (single source of truth)
    // and is always rendered - Pillar 2 + cngx A11y rule "IDs always
    // present".
    const desc = fixture.nativeElement.querySelector(
      `#${descId}`,
    ) as HTMLElement;
    expect(desc).not.toBeNull();
    expect(desc.classList.contains('cngx-sr-only')).toBe(true);
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

  describe('focus-driven group collapse', () => {
    function collapseFixture() {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperGroupCollapse('expand-active')),
        ],
      });
      const fixture = TestBed.createComponent(CollapseHost);
      fixture.detectChanges();
      return fixture;
    }

    it('folds the non-active group header visually without an aria-expanded disclosure', () => {
      const fixture = collapseFixture();
      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('.cngx-stepper__group-header'),
      ) as HTMLElement[];
      expect(headers.length).toBe(2);
      const [account, project] = headers;
      // Active step index 0 = 'A' under 'Account' -> Account expanded.
      expect(account.classList.contains('cngx-stepper__group-header--collapsed')).toBe(false);
      expect(project.classList.contains('cngx-stepper__group-header--collapsed')).toBe(true);
      // aria-expanded is unsupported on role="group" and the fold is not a
      // user-operable disclosure - no aria-expanded on either header.
      expect(account.getAttribute('aria-expanded')).toBeNull();
      expect(project.getAttribute('aria-expanded')).toBeNull();
    });

    it('drops collapsed child step buttons from the strip but keeps every panel in the DOM', () => {
      const fixture = collapseFixture();
      const labels = (
        Array.from(fixture.nativeElement.querySelectorAll('button.cngx-stepper__step')) as HTMLElement[]
      ).map((b) => b.querySelector('.cngx-stepper__label')?.textContent?.trim());
      // Account (active) keeps A, B; Project (collapsed) drops C, D; Finish kept.
      expect(labels).toEqual(['A', 'B', 'Finish']);
      // All 5 step panels stay rendered (ids preserved); 4 hidden, active visible.
      const panels = Array.from(
        fixture.nativeElement.querySelectorAll('.cngx-stepper__panel'),
      ) as HTMLElement[];
      expect(panels.length).toBe(5);
      expect(panels.filter((p) => p.hidden).length).toBe(4);
    });

    it('off baseline renders the full strip with no group header folded', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CollapseHost);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button.cngx-stepper__step');
      expect(buttons.length).toBe(5);
      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('.cngx-stepper__group-header'),
      ) as HTMLElement[];
      headers.forEach((h) => {
        expect(h.classList.contains('cngx-stepper__group-header--collapsed')).toBe(false);
        expect(h.getAttribute('aria-expanded')).toBeNull();
      });
    });

    function summaryFixture(...features: ReturnType<typeof withStepperGroupCollapse>[]) {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideStepperConfig(...features)],
      });
      const fixture = TestBed.createComponent(CollapseHost);
      fixture.detectChanges();
      return fixture;
    }

    it("default 'progress' summary shows completed/total on the collapsed group only", () => {
      // Account active+expanded, Project collapsed (2 steps, 0 done).
      const fixture = summaryFixture(withStepperGroupCollapse('expand-active'));
      const summaries = fixture.nativeElement.querySelectorAll('.cngx-stepper__group-summary');
      expect(summaries.length).toBe(1);
      expect((summaries[0] as HTMLElement).textContent?.trim()).toBe('0/2');
    });

    it("'count' summary shows the step count", () => {
      const fixture = summaryFixture(
        withStepperGroupCollapse('expand-active'),
        withStepperGroupCollapseSummary('count'),
      );
      const summary = fixture.nativeElement.querySelector(
        '.cngx-stepper__group-summary',
      ) as HTMLElement;
      expect(summary.textContent?.trim()).toBe('2');
    });

    it("'status' summary renders a state-coloured dot", () => {
      const fixture = summaryFixture(
        withStepperGroupCollapse('expand-active'),
        withStepperGroupCollapseSummary('status'),
      );
      const dot = fixture.nativeElement.querySelector(
        '.cngx-stepper__group-summary--status',
      ) as HTMLElement;
      expect(dot).not.toBeNull();
      expect(dot.getAttribute('data-state')).toBeTruthy();
      expect(dot.textContent?.trim()).toBe('');
    });

    it("'off' summary renders nothing on the collapsed group", () => {
      const fixture = summaryFixture(
        withStepperGroupCollapse('expand-active'),
        withStepperGroupCollapseSummary('off'),
      );
      expect(fixture.nativeElement.querySelector('.cngx-stepper__group-summary')).toBeNull();
    });
  });

  describe('space-driven density (density: auto)', () => {
    let lastResizeCb: ResizeObserverCallback | null = null;
    class TestResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        lastResizeCb = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    function emitWidth(width: number): void {
      lastResizeCb?.([{ contentRect: { width } } as ResizeObserverEntry], {} as ResizeObserver);
    }

    beforeEach(() => {
      lastResizeCb = null;
      vi.stubGlobal('ResizeObserver', TestResizeObserver);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function autoFixture() {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperDensity('auto')),
        ],
      });
      const fixture = TestBed.createComponent(HostCmp); // 3 flat steps A/B/C
      fixture.detectChanges();
      return fixture;
    }

    it('degrades [data-density] full -> compact -> minimal on container width', () => {
      const fixture = autoFixture();
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      expect(host.getAttribute('data-density')).toBe('full'); // width 0 before first measure
      emitWidth(3 * 130); // 130 px/step -> full
      fixture.detectChanges();
      expect(host.getAttribute('data-density')).toBe('full');
      emitWidth(3 * 100); // 100 px/step -> compact
      fixture.detectChanges();
      expect(host.getAttribute('data-density')).toBe('compact');
      emitWidth(3 * 40); // 40 px/step -> minimal
      fixture.detectChanges();
      expect(host.getAttribute('data-density')).toBe('minimal');
    });

    it('keeps the configured horizontal orientation at the minimal rung (no auto-vertical flip)', () => {
      const fixture = autoFixture();
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      emitWidth(3 * 40);
      fixture.detectChanges();
      expect(host.getAttribute('data-density')).toBe('minimal');
      // A horizontal stepper stays horizontal - minimal degrades to an
      // indicators-only row, it does not stack vertically.
      expect(host.getAttribute('aria-orientation')).toBe('horizontal');
      expect(host.getAttribute('data-orientation')).toBe('horizontal');
    });

    it('arrow-key axis stays horizontal at minimal (presenter spy)', () => {
      const fixture = autoFixture();
      const stepper = fixture.debugElement.children[0].componentInstance as CngxStepper;
      const selectNext = vi.spyOn(stepper.presenter, 'selectNext');
      const selectPrevious = vi.spyOn(stepper.presenter, 'selectPrevious');
      emitWidth(3 * 40);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button.cngx-stepper__step') as HTMLElement;
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(selectNext).toHaveBeenCalledTimes(1);
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(selectPrevious).toHaveBeenCalledTimes(1);
      // Vertical keys are inert on a horizontal strip, at every rung.
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(selectNext).toHaveBeenCalledTimes(1);
      expect(selectPrevious).toHaveBeenCalledTimes(1);
    });

    it('never emits the --collapsed label modifier under continuous density (any width)', () => {
      const fixture = autoFixture();
      // The continuous cqi budget owns label width now - the discrete
      // --collapsed modifier is gone. Labels stay rendered (in the a11y
      // tree, clipped by max-width), never display:none, at every width.
      for (const w of [3 * 130, 3 * 100, 3 * 40]) {
        emitWidth(w);
        fixture.detectChanges();
      }
      const labels = Array.from(
        fixture.nativeElement.querySelectorAll('button.cngx-stepper__step .cngx-stepper__label'),
      ) as HTMLElement[];
      expect(labels.length).toBe(3);
      expect(labels.every((l) => !l.classList.contains('cngx-stepper__label--collapsed'))).toBe(
        true,
      );
      // Each label keeps its text (accessible name retained on the button).
      expect(labels.every((l) => (l.textContent ?? '').trim().length > 0)).toBe(true);
    });

    it("'comfortable' (default) keeps data-density full at any width and sets no [data-density-auto]", () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      emitWidth(3 * 10);
      fixture.detectChanges();
      expect(host.getAttribute('data-density')).toBe('full');
      expect(host.getAttribute('aria-orientation')).toBe('horizontal');
      // No-scrollbar shrink CSS is scoped to [data-density-auto]; off here.
      expect(host.hasAttribute('data-density-auto')).toBe(false);
    });

    it("marks the host [data-density-auto] under density: 'auto'", () => {
      const fixture = autoFixture();
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      expect(host.hasAttribute('data-density-auto')).toBe(true);
    });

    it("publishes --cngx-step-count = step count under density: 'auto'", () => {
      const fixture = autoFixture(); // 3 flat steps
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      expect(host.style.getPropertyValue('--cngx-step-count')).toBe('3');
    });

    it("omits --cngx-step-count under the 'comfortable' default", () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
      expect(host.style.getPropertyValue('--cngx-step-count')).toBe('');
    });

    it("publishes per-step --cngx-step-distance = abs(index - active) under 'auto'", () => {
      const fixture = autoFixture(); // active defaults to step 0
      const steps = Array.from(
        fixture.nativeElement.querySelectorAll('button.cngx-stepper__step'),
      ) as HTMLElement[];
      expect(steps.map((s) => s.style.getPropertyValue('--cngx-step-distance'))).toEqual([
        '0',
        '1',
        '2',
      ]);
    });

    it('re-centres --cngx-step-distance after navigation', () => {
      @Component({
        standalone: true,
        imports: [CngxStepper, CngxStep],
        template: `
          <cngx-stepper [(activeStepIndex)]="active" aria-label="Nav">
            <div cngxStep label="A"></div>
            <div cngxStep label="B"></div>
            <div cngxStep label="C"></div>
          </cngx-stepper>
        `,
      })
      class NavHost {
        readonly active = signal(0);
      }
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideStepperConfig(withStepperDensity('auto'))],
      });
      const fixture = TestBed.createComponent(NavHost);
      fixture.detectChanges();
      const distances = (): string[] =>
        (Array.from(
          fixture.nativeElement.querySelectorAll('button.cngx-stepper__step'),
        ) as HTMLElement[]).map((s) => s.style.getPropertyValue('--cngx-step-distance'));
      expect(distances()).toEqual(['0', '1', '2']);
      fixture.componentInstance.active.set(1);
      fixture.detectChanges();
      expect(distances()).toEqual(['1', '0', '1']);
    });
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

  it('errored badge surfaces when not current step', () => {
    // data-state="error" on a non-current step now renders the badge
    // by default, closing the "step 1 errors while user is on step 3,
    // no visible cue" gap. The aggregator's `hasError()` flips
    // node.state() to 'error'; `shouldShow()` stays false to prove
    // the new fallback path (state=error alone) drives the badge.
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper [(activeStepIndex)]="active" aria-label="Errored non-current">
          <div cngxStep label="A" [errorAggregator]="agg"></div>
          <div cngxStep label="B"></div>
          <div cngxStep label="C"></div>
        </cngx-stepper>
      `,
    })
    class ErroredNonCurrentHost {
      readonly active = signal(2);
      readonly agg = {
        hasError: signal(true),
        shouldShow: signal(false),
        announcement: signal('Two validation errors'),
        errorCount: signal(2),
        errorLabels: signal([] as readonly string[]),
        activeErrors: signal([] as readonly string[]),
        addSource: () => {},
        removeSource: () => {},
      };
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ErroredNonCurrentHost);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button.cngx-stepper__step',
    ) as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
    const indicator = buttons[0].querySelector(
      '.cngx-stepper__indicator',
    ) as HTMLElement;
    expect(indicator.getAttribute('data-state')).toBe('error');
    const badge = buttons[0].querySelector(
      '.cngx-stepper__badge',
    ) as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
    // The default badge template renders CNGX_STEPPER_GLYPHS.errorBadge.
    expect(badge?.textContent?.trim()).toBe(CNGX_STEPPER_GLYPHS.errorBadge);
  });

  it('hover affordance on non-linear mode', async () => {
    // Hover state rule body declares `cursor: pointer` so non-linear
    // mode reads as clickable. happy-dom does not resolve @layer
    // scoping reliably; assert against the source CSS instead -
    // mirrors the classic-skin.snapshot.spec.ts approach.
    const cssPath = (await import('node:path')).resolve(
      __dirname,
      'stepper.component.css',
    );
    const css = (await import('node:fs')).readFileSync(cssPath, 'utf-8');
    const hoverRule = css.match(/\.cngx-stepper__step:hover[^{]+{[^}]+}/);
    expect(hoverRule).not.toBeNull();
    expect(hoverRule![0]).toContain('cursor: pointer');
    expect(hoverRule![0]).toMatch(/:not\(\[aria-disabled='true'\]\)/);
  });

  it('host aria-label falls back to CNGX_STEPPER_CONFIG.ariaLabels.stepperRegion when no input bound', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper>
          <div cngxStep label="A"></div>
        </cngx-stepper>
      `,
    })
    class NoLabelHost {}
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperAriaLabels({ stepperRegion: 'Order Wizard' }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(NoLabelHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Order Wizard');
  });

  it('host aria-label falls back to i18n.stepperLabel when ariaLabels.stepperRegion is explicitly cleared', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper>
          <div cngxStep label="A"></div>
        </cngx-stepper>
      `,
    })
    class BareHost {}
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Override clears stepperRegion so the cascade falls through
        // to the i18n bundle. Without this override the library
        // default 'Stepper' for ariaLabels.stepperRegion wins.
        provideStepperConfig(
          withStepperAriaLabels({ stepperRegion: undefined }),
        ),
        provideStepperI18n(withStepperI18nLabels({ stepperLabel: 'Schrittfolge' })),
      ],
    });
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-stepper') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Schrittfolge');
  });

  it('group aria-roledescription resolves from config.fallbackLabels.groupRoleDescription', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep, CngxStepGroup],
      template: `
        <cngx-stepper aria-label="x">
          <div cngxStepGroup label="g">
            <div cngxStep label="A"></div>
          </div>
        </cngx-stepper>
      `,
    })
    class GroupRoleHost {}
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withStepperFallbackLabels({ groupRoleDescription: 'Schritt-Gruppe' }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(GroupRoleHost);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.cngx-stepper__group-header',
    ) as HTMLElement;
    expect(group.getAttribute('aria-roledescription')).toBe('Schritt-Gruppe');
  });

  it('organism stepsOnly is reference-stable across shape-stable re-emits (flatStepsEqual)', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper [(activeStepIndex)]="active" aria-label="Stable">
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
        </cngx-stepper>
      `,
    })
    class StableHost {
      readonly active = signal(0);
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(StableHost);
    fixture.detectChanges();
    const stepperEl = fixture.debugElement.children[0];
    const stepper = stepperEl.componentInstance as {
      readonly stepsOnly: () => readonly unknown[];
    };
    const before = stepper.stepsOnly();
    fixture.componentInstance.active.set(1);
    fixture.detectChanges();
    const after = stepper.stepsOnly();
    // No registry change - flatStepsEqual short-circuits the computed
    // and downstream consumers see the same reference.
    expect(after).toBe(before);
  });

  it('label/content template lookup is stable across redundant re-renders (Map equality)', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper [(activeStepIndex)]="active" aria-label="Stable">
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
        </cngx-stepper>
      `,
    })
    class StableHost {
      readonly active = signal(0);
    }
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(StableHost);
    fixture.detectChanges();
    const stepperEl = fixture.debugElement.children[0];
    const stepper = stepperEl.componentInstance as CngxStepper;
    // labelTemplateFor reads the Map computed; calling it twice on
    // an unchanged registry must hit the same Map reference (the
    // stepDirectiveMapEqual guard short-circuits the computed).
    const flat = stepper.flatSteps();
    const firstId = flat[0].id;
    const a1 = stepper.labelTemplateFor(firstId);
    fixture.componentInstance.active.set(1);
    fixture.detectChanges();
    const a2 = stepper.labelTemplateFor(firstId);
    expect(a1).toBe(a2);
  });

  it('busy spinner is absent + aria-busy is null when no commit is in flight', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.cngx-stepper__busy-spinner'),
    ).toHaveLength(0);
    const button = fixture.nativeElement.querySelector(
      'button.cngx-stepper__step',
    ) as HTMLButtonElement;
    // No pending commit → aria-busy attribute absent (null binding).
    expect(button.getAttribute('aria-busy')).toBeNull();
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

  describe('commit-action live region', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper
          aria-label="Wizard"
          [commitAction]="action"
          [commitMode]="mode"
        >
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
          <div cngxStep label="C"></div>
        </cngx-stepper>
      `,
    })
    class CommitHost {
      action: CngxStepperCommitAction | null = () => true;
      mode: 'optimistic' | 'pessimistic' = 'pessimistic';
    }

    it('mounts a polite live-region span (role=status, aria-live=polite, empty when idle)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector(
        '.cngx-stepper__live-region',
      ) as HTMLElement;
      expect(region).not.toBeNull();
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('role')).toBe('status');
      expect(region.textContent?.trim()).toBe('');
    });

    it('announces commitInFlight while a pessimistic commit is pending', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.action = () =>
        new Promise<boolean>(() => undefined);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[2].click();
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector(
        '.cngx-stepper__live-region',
      ) as HTMLElement;
      expect(region.textContent?.trim()).toBe('Committing step…');
    });

    it('error transition surfaces commitRolledBackTo with the origin step label', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector(
        '.cngx-stepper__live-region',
      ) as HTMLElement;
      expect(region.textContent?.trim()).toBe('Reverted to step "A".');
    });

    it('error transition falls back to commitFailedRetry when origin is unresolvable', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector(
        '.cngx-stepper__live-region',
      ) as HTMLElement;
      // Rich phrase first.
      expect(region.textContent?.trim()).toBe('Reverted to step "A".');
      // Dismiss the rejection - clearing lastFailedIndex collapses the
      // priority chain to the generic fallback. The organism exposes
      // `clearLastFailed()` as a public delegator so consumers using
      // `#s="cngxStepper"` don't need to inject CNGX_STEPPER_HOST.
      const stepperEl = fixture.debugElement.children[0];
      const stepper = stepperEl.componentInstance as {
        clearLastFailed(): void;
      };
      stepper.clearLastFailed();
      fixture.detectChanges();
      // After clearLastFailed the priority chain falls through to the
      // generic message - origin slot still set but failedIdx undefined.
      expect(region.textContent?.trim()).toBe('Commit failed - retry?');
    });

    it('host carries aria-busy="true" while a commit is pending and clears on resolve', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      let resolve!: (value: boolean) => void;
      fixture.componentInstance.action = () =>
        new Promise<boolean>((r) => {
          resolve = r;
        });
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector(
        'cngx-stepper',
      ) as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBeNull();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[2].click();
      fixture.detectChanges();
      expect(host.getAttribute('aria-busy')).toBe('true');
      resolve(true);
      return Promise.resolve().then(() => {
        fixture.detectChanges();
        expect(host.getAttribute('aria-busy')).toBeNull();
      });
    });

    it('per-step aria-describedby surfaces stepRolledBackSuffix when lastFailedIndex matches its flatIndex', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      const descId = buttons[1].getAttribute('aria-describedby')!;
      const desc = fixture.nativeElement.querySelector(
        `#${descId}`,
      ) as HTMLElement;
      // Persistent suffix appended to the per-step descriptor.
      expect(desc.textContent?.trim()).toBe(
        'Step 2 of 3: B This step was rolled back.',
      );
      // Sibling steps keep the unmodified phrase.
      const aDescId = buttons[0].getAttribute('aria-describedby')!;
      const aDesc = fixture.nativeElement.querySelector(
        `#${aDescId}`,
      ) as HTMLElement;
      expect(aDesc.textContent?.trim()).toBe('Step 1 of 3: A');
    });

    it('default rejection-icon outlet renders CNGX_STEPPER_GLYPHS.rejectionIcon (single source of truth)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      const icon = buttons[1].querySelector(
        '.cngx-stepper__rejection-icon',
      ) as HTMLElement | null;
      expect(icon).not.toBeNull();
      expect(icon!.textContent?.trim()).toBe(CNGX_STEPPER_GLYPHS.rejectionIcon);
    });

    it('binds cngx-stepper__step--rejected on the rejected step row when lastFailedIndex matches its flatIndex', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      // Rejected row carries the modifier; siblings do not.
      expect(buttons[1].classList.contains('cngx-stepper__step--rejected')).toBe(
        true,
      );
      expect(buttons[0].classList.contains('cngx-stepper__step--rejected')).toBe(
        false,
      );
      expect(buttons[2].classList.contains('cngx-stepper__step--rejected')).toBe(
        false,
      );
      // Modifier clears once the rejection state is dismissed.
      const stepper = fixture.debugElement.children[0].componentInstance as {
        clearLastFailed(): void;
      };
      stepper.clearLastFailed();
      fixture.detectChanges();
      expect(buttons[1].classList.contains('cngx-stepper__step--rejected')).toBe(
        false,
      );
    });

    it('clearLastFailed delegator forwards to the presenter and zeroes lastFailedIndex', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      const stepperEl = fixture.debugElement.children[0];
      const stepper = stepperEl.componentInstance as {
        clearLastFailed(): void;
        readonly presenter: { lastFailedIndex(): number | undefined };
      };
      // Reject set lastFailedIndex on the presenter contract.
      expect(stepper.presenter.lastFailedIndex()).toBe(1);
      stepper.clearLastFailed();
      fixture.detectChanges();
      expect(stepper.presenter.lastFailedIndex()).toBeUndefined();
    });

    it('returns to empty when commitTransition settles back to idle', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.action = () => true;
      fixture.detectChanges();
      const region = fixture.nativeElement.querySelector(
        '.cngx-stepper__live-region',
      ) as HTMLElement;
      expect(region.textContent?.trim()).toBe('');
      // Sync success collapses pending → success in one tick; tracker's
      // current is `success` not `idle`, so the region stays quiet.
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      buttons[1].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('');
    });
  });

  describe('mobile-swipe navigation', () => {
    type SwipeDirection = 'left' | 'right' | 'up' | 'down';
    interface SwipeShape {
      readonly swipeNav: {
        readonly swipeEnabled: () => boolean;
        readonly handleSwipe: (direction: SwipeDirection) => void;
      };
      readonly presenter: { activeStepIndex: () => number };
    }

    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper
          aria-label="Wizard"
          [(activeStepIndex)]="active"
          [linear]="linear"
          [mobileSwipe]="mobileSwipe"
        >
          <div cngxStep label="A" [completed]="stepACompleted"></div>
          <div cngxStep label="B"></div>
          <div cngxStep label="C"></div>
        </cngx-stepper>
      `,
    })
    class SwipeHost {
      readonly active = signal(0);
      linear = false;
      mobileSwipe: boolean | undefined = undefined;
      stepACompleted = false;
    }

    function stepperOf(fixture: ReturnType<typeof TestBed.createComponent<SwipeHost>>): SwipeShape {
      return fixture.debugElement.children[0].componentInstance as unknown as SwipeShape;
    }

    it('handleSwipe("left") routes through presenter.selectNext (advances the active step)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.detectChanges();
      const stepper = stepperOf(fixture);
      expect(stepper.presenter.activeStepIndex()).toBe(0);
      stepper.swipeNav.handleSwipe('left');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(1);
    });

    it('handleSwipe("right") routes through presenter.selectPrevious (retreats the active step)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.componentInstance.active.set(2);
      fixture.detectChanges();
      const stepper = stepperOf(fixture);
      expect(stepper.presenter.activeStepIndex()).toBe(2);
      stepper.swipeNav.handleSwipe('right');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(1);
    });

    it('vertical directions are ignored (no movement on "up" or "down")', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.componentInstance.active.set(1);
      fixture.detectChanges();
      const stepper = stepperOf(fixture);
      stepper.swipeNav.handleSwipe('up');
      stepper.swipeNav.handleSwipe('down');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(1);
    });

    it('linear mode blocks left-swipe while the next step is incomplete (shared with click gate)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.componentInstance.linear = true;
      fixture.detectChanges();
      const stepper = stepperOf(fixture);
      expect(stepper.presenter.activeStepIndex()).toBe(0);
      stepper.swipeNav.handleSwipe('left');
      fixture.detectChanges();
      // Linear policy refuses the jump because step A is not yet 'success'.
      expect(stepper.presenter.activeStepIndex()).toBe(0);
    });

    it('linear mode lets right-swipe retreat without gating (back-move is ungated)', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.componentInstance.linear = true;
      fixture.componentInstance.stepACompleted = true;
      fixture.componentInstance.active.set(1);
      fixture.detectChanges();
      const stepper = stepperOf(fixture);
      stepper.swipeNav.handleSwipe('right');
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(0);
    });

    it('swipeEnabled defaults to true when neither Input nor config overrides', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.detectChanges();
      expect(stepperOf(fixture).swipeNav.swipeEnabled()).toBe(true);
    });

    it('swipeEnabled honours the config override when no Input is bound', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileSwipe(false)),
        ],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.detectChanges();
      expect(stepperOf(fixture).swipeNav.swipeEnabled()).toBe(false);
    });

    it('per-instance [mobileSwipe] wins over a config override (Input -> config -> default)', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperMobileSwipe(false)),
        ],
      });
      const fixture = TestBed.createComponent(SwipeHost);
      fixture.componentInstance.mobileSwipe = true;
      fixture.detectChanges();
      expect(stepperOf(fixture).swipeNav.swipeEnabled()).toBe(true);
    });
  });

  describe('headerNavigation policy', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper
          aria-label="Wizard"
          [linear]="linear"
          [headerNavigation]="headerNavigation"
          [(activeStepIndex)]="active"
        >
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
          <div cngxStep label="C"></div>
        </cngx-stepper>
      `,
    })
    class NavHost {
      linear = false;
      headerNavigation: 'none' | 'visited' | undefined = undefined;
      readonly active = signal(0);
    }

    it("'none' renders inert label headers - no <button>, no roving item, strip is a list", () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.componentInstance.headerNavigation = 'none';
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelectorAll('button.cngx-stepper__step').length).toBe(0);
      const items = root.querySelectorAll('span.cngx-stepper__step--static');
      expect(items.length).toBe(3);
      expect(items[0].getAttribute('role')).toBe('listitem');
      expect(items[0].getAttribute('aria-current')).toBe('step');
      // No roving-tabindex / tabindex on the inert header.
      expect(items[0].hasAttribute('tabindex')).toBe(false);
      const strip = root.querySelector('.cngx-stepper__strip') as HTMLElement;
      expect(strip.getAttribute('role')).toBe('list');
    });

    it("'none' host keydown is a no-op (active step unchanged)", () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.componentInstance.headerNavigation = 'none';
      fixture.detectChanges();
      const stepper = fixture.debugElement.children[0].componentInstance as {
        handleStripKeyDown(e: KeyboardEvent): void;
        readonly presenter: { activeStepIndex(): number };
      };
      const strip = fixture.nativeElement.querySelector(
        '.cngx-stepper__step--static',
      ) as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      Object.defineProperty(event, 'target', { value: strip });
      stepper.handleStripKeyDown(event);
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(0);
    });

    it("'visited' + linear=true marks forward-incomplete headers aria-disabled but keeps them focusable", () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.componentInstance.linear = true;
      fixture.componentInstance.headerNavigation = 'visited';
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      // Active step A is incomplete (idle) → forward jump to B/C blocked.
      expect(buttons[0].getAttribute('aria-disabled')).toBeNull();
      expect(buttons[1].getAttribute('aria-disabled')).toBe('true');
      expect(buttons[2].getAttribute('aria-disabled')).toBe('true');
      // Focusable: no native disabled attribute, still a <button>.
      expect(buttons[1].hasAttribute('disabled')).toBe(false);
    });

    it("'visited' + linear=false is byte-identical to today (no aria-disabled on enabled headers)", () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.componentInstance.headerNavigation = 'visited';
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      expect(buttons.length).toBe(3);
      expect(buttons[0].getAttribute('aria-disabled')).toBeNull();
      expect(buttons[1].getAttribute('aria-disabled')).toBeNull();
      expect(buttons[2].getAttribute('aria-disabled')).toBeNull();
    });

    it('default (no input, no config) is visited - headers are buttons', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(NavHost);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelectorAll('button.cngx-stepper__step').length,
      ).toBe(3);
    });

    it("config withStepperHeaderNavigation('none') applies when no input is bound", () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperHeaderNavigation('none')),
        ],
      });
      const fixture = TestBed.createComponent(NavHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('button.cngx-stepper__step').length).toBe(0);
      expect(
        fixture.nativeElement.querySelectorAll('span.cngx-stepper__step--static').length,
      ).toBe(3);
    });

    it("per-instance [headerNavigation] wins over the config (Input -> config -> 'visited')", () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperConfig(withStepperHeaderNavigation('none')),
        ],
      });
      const fixture = TestBed.createComponent(NavHost);
      fixture.componentInstance.headerNavigation = 'visited';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('button.cngx-stepper__step').length).toBe(3);
    });
  });

  describe('*cngxStepError slot', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper aria-label="Err">
          <div cngxStep [error]="msg()"></div>
          <div cngxStep label="B"></div>
        </cngx-stepper>
      `,
    })
    class DefaultErrorHost {
      readonly msg = signal<string | boolean>('Card declined');
    }

    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep, CngxStepError],
      template: `
        <cngx-stepper aria-label="Err">
          <div cngxStep [error]="'Card declined'"></div>
          <div cngxStep label="B"></div>
          <ng-template cngxStepError let-message="message">
            <em class="custom-err">{{ message }}!</em>
          </ng-template>
        </cngx-stepper>
      `,
    })
    class SlotErrorHost {}

    it('renders the resolved message in a row below the strip (classic)', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(DefaultErrorHost);
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector(
        '.cngx-stepper__error-summary',
      ) as HTMLElement;
      expect(err).not.toBeNull();
      expect(err.textContent).toContain('Card declined');
    });

    it('omits the row for a boolean [error] (no real message - state cue suffices)', () => {
      @Component({
        standalone: true,
        imports: [CngxStepper, CngxStep],
        template: `
          <cngx-stepper aria-label="Err">
            <div cngxStep label="A" [error]="true"></div>
            <div cngxStep label="B"></div>
          </cngx-stepper>
        `,
      })
      class BoolErrorHost {}
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(BoolErrorHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-stepper__error-summary')).toBeNull();
    });

    it('clears the error row when [error] goes false', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(DefaultErrorHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-stepper__error-summary')).not.toBeNull();
      fixture.componentInstance.msg.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-stepper__error-summary')).toBeNull();
    });

    it('a per-instance *cngxStepError template overrides the default in the row', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(SlotErrorHost);
      fixture.detectChanges();
      const custom = fixture.nativeElement.querySelector(
        '.cngx-stepper__error-summary .custom-err',
      ) as HTMLElement;
      expect(custom).not.toBeNull();
      expect(custom.textContent?.trim()).toBe('Card declined!');
    });

    it('renders the error row below the strip on every strip skin (e.g. path-chevron)', () => {
      @Component({
        standalone: true,
        imports: [CngxStepper, CngxStep],
        template: `
          <cngx-stepper aria-label="Err" skin="path-chevron">
            <div cngxStep label="A" [error]="'Card declined'"></div>
            <div cngxStep label="B"></div>
          </cngx-stepper>
        `,
      })
      class MiniSkinHost {}
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(MiniSkinHost);
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector(
        '.cngx-stepper__error-summary',
      ) as HTMLElement;
      expect(err).not.toBeNull();
      expect(err.textContent).toContain('Card declined');
    });
  });

  describe('header busy gate (locks with the footer during a commit)', () => {
    @Component({
      standalone: true,
      imports: [CngxStepper, CngxStep],
      template: `
        <cngx-stepper aria-label="Wizard" [commitAction]="action" commitMode="pessimistic">
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
          <div cngxStep label="C"></div>
        </cngx-stepper>
      `,
    })
    class BusyHost {
      action: CngxStepperCommitAction = () => new Promise<boolean>(() => undefined);
    }

    it('marks every header aria-disabled while a commit is pending and ignores clicks (no supersede)', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const fixture = TestBed.createComponent(BusyHost);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'button.cngx-stepper__step',
      ) as NodeListOf<HTMLButtonElement>;
      // Start a pessimistic commit that never resolves -> busy.
      buttons[1].click();
      fixture.detectChanges();
      const stepper = fixture.debugElement.children[0].componentInstance as {
        readonly presenter: { busy(): boolean; activeStepIndex(): number };
      };
      expect(stepper.presenter.busy()).toBe(true);
      // Headers lock (aria-disabled) but stay focusable - no native disabled.
      buttons.forEach((b) => {
        expect(b.getAttribute('aria-disabled')).toBe('true');
        expect(b.hasAttribute('disabled')).toBe(false);
      });
      // A header click while busy is a no-op: the pending commit is not superseded.
      buttons[2].click();
      fixture.detectChanges();
      expect(stepper.presenter.activeStepIndex()).toBe(0);
    });
  });
});
