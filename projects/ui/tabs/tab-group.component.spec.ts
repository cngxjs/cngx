import {
  Component,
  TemplateRef,
  ViewChild,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import {
  CNGX_TAB_GROUP_HOST,
  CNGX_TABS_CONFIG,
  CngxTab,
  CngxTabBusySpinner,
  CngxTabContent,
  CngxTabErrorBadge,
  CngxTabLabel,
  CngxTabRejectionIcon,
  provideCngxTabs,
  provideTabsConfig,
  provideTabsI18n,
  withTabErrorBadgeTemplate,
  withTabsAriaLabels,
  withTabsDefaultOrientation,
  withTabsFallbackLabels,
  withTabsI18nLabels,
  type CngxTabErrorBadgeContext,
  type CngxTabsCommitAction,
} from '@cngx/common/tabs';

import { CngxTabGroup } from './tab-group.component';

@Component({
  standalone: true,
  imports: [CngxTabGroup, CngxTab, CngxTabLabel, CngxTabContent],
  template: `
    <cngx-tab-group aria-label="Settings">
      <div cngxTab [label]="'A'">
        <ng-template cngxTabLabel>A label</ng-template>
        <ng-template cngxTabContent>A content</ng-template>
      </div>
      <div cngxTab [label]="'B'">
        <ng-template cngxTabLabel>B label</ng-template>
        <ng-template cngxTabContent>B content</ng-template>
      </div>
      <div cngxTab [label]="'C'">
        <ng-template cngxTabLabel>C label</ng-template>
        <ng-template cngxTabContent>C content</ng-template>
      </div>
    </cngx-tab-group>
  `,
})
class HostCmp {}

@Component({
  standalone: true,
  imports: [CngxTabGroup, CngxTab],
  template: `
    <cngx-tab-group orientation="vertical" aria-label="Vertical">
      <div cngxTab [label]="'A'"></div>
      <div cngxTab [label]="'B'"></div>
    </cngx-tab-group>
  `,
})
class VerticalHost {}

describe('CngxTabGroup organism', () => {
  it('host carries role="group" + aria-orientation="horizontal" + data-orientation', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('role')).toBe('group');
    expect(host.getAttribute('aria-orientation')).toBe('horizontal');
    expect(host.getAttribute('data-orientation')).toBe('horizontal');
    expect(host.getAttribute('aria-label')).toBe('Settings');
  });

  it('inner strip carries role="tablist" with aria-orientation', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tablist = fixture.nativeElement.querySelector(
      '[role="tablist"]',
    ) as HTMLElement;
    expect(tablist).not.toBeNull();
    expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('renders one role="tab" button per registered tab', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll(
      'button[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(3);
  });

  it('every tab button carries an i18n.selectedTab(label, position, count) aria-label', () => {
    // Pillar 2 — verbose accessible name in-band. Without this AT
    // users hear only the bare label text and the tablist's enumeration
    // ("Tab 2"); the i18n phrase "Tab 2 of 5: Settings" carries
    // position context inside the announcement that AT renders on
    // focus. Visual users still see the bare label span (text content
    // unchanged); aria-label takes precedence over text-content for
    // AT only.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    expect(tabs[0].getAttribute('aria-label')).toBe('Tab 1 of 3: A');
    expect(tabs[1].getAttribute('aria-label')).toBe('Tab 2 of 3: B');
    expect(tabs[2].getAttribute('aria-label')).toBe('Tab 3 of 3: C');
  });

  it('first tab is aria-selected="true", others "false"', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('false');
  });

  it('aria-controls on each tab points to a real role="tabpanel"', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    for (const tab of tabs) {
      const controls = tab.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      const panel = fixture.nativeElement.querySelector(
        `[role="tabpanel"]#${controls}`,
      );
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute('aria-labelledby')).toBe(tab.id);
    }
  });

  it('only the selected panel is visible (others have [hidden])', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const panels = Array.from(
      fixture.nativeElement.querySelectorAll(
        '[role="tabpanel"]',
      ) as NodeListOf<HTMLElement>,
    );
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    expect(panels[2].hidden).toBe(true);
  });

  it('clicking a tab updates aria-selected + makes its panel visible', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    tabs[1].click();
    fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    const panels = Array.from(
      fixture.nativeElement.querySelectorAll(
        '[role="tabpanel"]',
      ) as NodeListOf<HTMLElement>,
    );
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(false);
  });

  it('vertical orientation flows through aria-orientation + data-orientation', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(VerticalHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('aria-orientation')).toBe('vertical');
    expect(host.getAttribute('data-orientation')).toBe('vertical');
    const tablist = fixture.nativeElement.querySelector(
      '[role="tablist"]',
    ) as HTMLElement;
    expect(tablist.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('aria-label resolves Input → ariaLabels.tabsRegion config → i18n.tabsLabel', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsAriaLabels({ tabsRegion: 'Reiter' })),
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group>
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class NoLabelHost {}
    const fixture = TestBed.createComponent(NoLabelHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Reiter');
  });

  it('aria-labelledby on host suppresses aria-label', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <h2 id="h">Heading</h2>
        <cngx-tab-group aria-labelledby="h">
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class LabelledByHost {}
    const fixture = TestBed.createComponent(LabelledByHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('aria-labelledby')).toBe('h');
    expect(host.getAttribute('aria-label')).toBeNull();
  });

  it('orientation default flows through provideTabsConfig', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsDefaultOrientation('vertical')),
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group aria-label="X">
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class ConfigHost {}
    const fixture = TestBed.createComponent(ConfigHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    // Note: presenter `orientation` Input has a literal default of
    // 'horizontal' (Phase 1 contract). The cascade-from-config path
    // is documented as Phase 5 polish; this test pins the current
    // behaviour so we notice when the cascade lands.
    expect(host.getAttribute('aria-orientation')).toBe('horizontal');
  });

  describe('error-aggregation badge + descriptor', () => {
    function stubAggregator(opts: {
      hasError: boolean;
      revealed: boolean;
      announcement: string;
    }): CngxErrorAggregatorContract {
      return {
        hasError: signal(opts.hasError),
        errorCount: signal(opts.hasError ? 1 : 0),
        activeErrors: signal<readonly string[]>([]),
        errorLabels: signal<readonly string[]>([]),
        shouldShow: signal(opts.revealed),
        announcement: signal(opts.announcement),
        addSource: () => {},
        removeSource: () => {},
      };
    }

    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group aria-label="X">
          <div cngxTab [label]="'A'" [errorAggregator]="aggA"></div>
          <div cngxTab [label]="'B'"></div>
        </cngx-tab-group>
      `,
    })
    class BadgeHost {
      aggA = stubAggregator({
        hasError: true,
        revealed: true,
        announcement: '2 errors',
      });
      aggB: CngxErrorAggregatorContract | undefined = undefined;
      setRevealed(value: boolean) {
        (this.aggA.shouldShow as ReturnType<typeof signal<boolean>>).set(value);
      }
    }

    it('renders the badge only when shouldShow() is true', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(BadgeHost);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      expect(tabs[0].querySelector('.cngx-tabs__badge')).not.toBeNull();
      expect(tabs[1].querySelector('.cngx-tabs__badge')).toBeNull();
    });

    it('aria-describedby ID is always present in the DOM (sr-only span lives even when empty)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(BadgeHost);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      for (const tab of tabs) {
        const descId = tab.getAttribute('aria-describedby');
        expect(descId).toBeTruthy();
        const span = fixture.nativeElement.querySelector(
          `#${descId}`,
        ) as HTMLElement;
        expect(span).not.toBeNull();
        expect(span.classList.contains('cngx-sr-only')).toBe(true);
      }
    });

    it('descriptor content reflects the aggregator announcement when revealed', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(BadgeHost);
      fixture.detectChanges();
      const tabA = fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      )[0] as HTMLButtonElement;
      const descId = tabA.getAttribute('aria-describedby')!;
      const span = fixture.nativeElement.querySelector(
        `#${descId}`,
      ) as HTMLElement;
      expect(span.textContent?.trim()).toBe('2 errors');
    });

    it('descriptor content collapses to empty when shouldShow() flips to false', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(BadgeHost);
      fixture.detectChanges();
      fixture.componentInstance.setRevealed(false);
      fixture.detectChanges();
      const tabA = fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      )[0] as HTMLButtonElement;
      expect(tabA.querySelector('.cngx-tabs__badge')).toBeNull();
      const descId = tabA.getAttribute('aria-describedby')!;
      const span = fixture.nativeElement.querySelector(
        `#${descId}`,
      ) as HTMLElement;
      expect(span.textContent?.trim()).toBe('');
    });

    it('descriptor falls back to i18n.tabHasErrors(count) when shouldShow() is true but announcement is empty', () => {
      // Pillar 2 — when an aggregator wants reveal but supplies no
      // announcement string (legacy aggregators, partial integrations,
      // localisation gaps), the SR descriptor falls back to the i18n
      // `tabHasErrors(errorCount)` phrase rather than going silent.
      // The visible badge still renders; the descriptor stays
      // populated so AT users hear the count even without an
      // aggregator-supplied phrase.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab],
        template: `
          <cngx-tab-group aria-label="X">
            <div cngxTab [label]="'A'" [errorAggregator]="aggA"></div>
          </cngx-tab-group>
        `,
      })
      class EmptyAnnouncementHost {
        aggA: CngxErrorAggregatorContract = {
          hasError: signal(true),
          errorCount: signal(3),
          activeErrors: signal<readonly string[]>([]),
          errorLabels: signal<readonly string[]>([]),
          shouldShow: signal(true),
          announcement: signal(''),
          addSource: () => {},
          removeSource: () => {},
        };
      }
      const fixture = TestBed.createComponent(EmptyAnnouncementHost);
      fixture.detectChanges();
      const tabA = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      const descId = tabA.getAttribute('aria-describedby')!;
      const span = fixture.nativeElement.querySelector(
        `#${descId}`,
      ) as HTMLElement;
      // Default English: `${count} error(s)` — 3 → "3 errors".
      expect(span.textContent?.trim()).toBe('3 errors');
    });

    it('no aggregator → no badge, descriptor span empty (graceful fallback)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab],
        template: `
          <cngx-tab-group aria-label="X">
            <div cngxTab [label]="'A'"></div>
          </cngx-tab-group>
        `,
      })
      class NoAggHost {}
      const fixture = TestBed.createComponent(NoAggHost);
      fixture.detectChanges();
      const tab = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      expect(tab.querySelector('.cngx-tabs__badge')).toBeNull();
      const descId = tab.getAttribute('aria-describedby')!;
      const span = fixture.nativeElement.querySelector(
        `#${descId}`,
      ) as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.textContent?.trim()).toBe('');
    });
  });

  describe('commit-action busy state + live region', () => {
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group
          aria-label="X"
          [commitAction]="action"
          [commitMode]="mode"
        >
          <div cngxTab [label]="'A'"></div>
          <div cngxTab [label]="'B'"></div>
          <div cngxTab [label]="'C'"></div>
        </cngx-tab-group>
      `,
    })
    class CommitHost {
      action: CngxTabsCommitAction | null = () => true;
      mode: 'optimistic' | 'pessimistic' = 'pessimistic';
    }

    it('renders aria-busy + spinner on the target tab in pessimistic mode (in-flight)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      // Action that never resolves — synchronous Subject would also
      // work but `new Promise(() => {})` keeps the runtime simple.
      fixture.componentInstance.action = () =>
        new Promise<boolean>(() => undefined);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      expect(tabs[2].getAttribute('aria-busy')).toBe('true');
      expect(tabs[2].querySelector('.cngx-tabs__busy-spinner')).not.toBeNull();
      // Origin stays selected during pending.
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    });

    it('mounts a polite live-region span that carries the in-flight phrase', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.action = () =>
        new Promise<boolean>(() => undefined);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      const region = fixture.nativeElement.querySelector(
        '.cngx-tabs__live-region',
      ) as HTMLElement;
      expect(region).not.toBeNull();
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('role')).toBe('status');
      // Idle: announcement is empty.
      expect(region.textContent?.trim()).toBe('');
      // Trigger a transition.
      tabs[1].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('Switching tab…');
    });

    it('optimistic + sync error: rolls back to origin and clears aria-busy', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      // Sync false → roll back to origin, no pending state lingers.
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(tabs[2].getAttribute('aria-selected')).toBe('false');
      expect(tabs[2].getAttribute('aria-busy')).toBeNull();
    });

    it('error transition surfaces commitRolledBackTo on the live region with the origin tab label', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      const region = fixture.nativeElement.querySelector(
        '.cngx-tabs__live-region',
      ) as HTMLElement;
      // Origin tab is index 0 (label 'A'). Reject sets lastFailedIndex
      // and retains originIndexDuringCommit; liveAnnouncement's priority
      // chain resolves the origin label and emits the rich phrase
      // (commitRolledBackTo wins over the generic commitFailedRetry
      // fallback whenever both gate signals are set).
      tabs[1].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe(
        'Could not save changes — reverted to "A".',
      );
    });

    it('rejected commit decorates the failed tab with cngx-tab--rejected + rejection-icon span', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      expect(tabs[2].classList.contains('cngx-tab--rejected')).toBe(true);
      expect(tabs[2].querySelector('.cngx-tabs__rejection-icon')).not.toBeNull();
      // Untouched tabs stay clean — visual decoration is index-precise.
      expect(tabs[0].classList.contains('cngx-tab--rejected')).toBe(false);
      expect(tabs[1].classList.contains('cngx-tab--rejected')).toBe(false);
      expect(tabs[0].querySelector('.cngx-tabs__rejection-icon')).toBeNull();
    });

    it('liveAnnouncement falls back to commitFailedRetry when lastFailedIndex is unset', () => {
      // Idempotent case: a sync rejection on `select(target === activeIndex)`
      // is filtered upstream by the no-op guard. To force the
      // `error`-branch fallback we'd need an originIndexDuringCommit ===
      // undefined error edge — which currently happens only in a torn
      // state (programmatic rejection without a prior select() opening
      // the window). Cover the contract by clearLastFailed-then-error:
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => false;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      const region = fixture.nativeElement.querySelector(
        '.cngx-tabs__live-region',
      ) as HTMLElement;
      tabs[1].click();
      fixture.detectChanges();
      // First reject — rich phrase fires.
      expect(region.textContent?.trim()).toBe(
        'Could not save changes — reverted to "A".',
      );
      // Sanity: clearing lastFailedIndex while still in the error
      // state collapses the rich resolution back to the generic phrase
      // (failedIdx is now undefined; origin retained but gated). This
      // is the contract-defined fallback path.
      const host = fixture.debugElement.children[0].injector.get(
        CNGX_TAB_GROUP_HOST,
      );
      host.clearLastFailed();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('Tab change refused — retry?');
    });

    it('successful re-pick of the failed tab clears cngx-tab--rejected + rejection-icon span', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      let next = false;
      fixture.componentInstance.action = () => next;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      expect(tabs[2].classList.contains('cngx-tab--rejected')).toBe(true);
      next = true;
      tabs[2].click();
      fixture.detectChanges();
      expect(tabs[2].classList.contains('cngx-tab--rejected')).toBe(false);
      expect(tabs[2].querySelector('.cngx-tabs__rejection-icon')).toBeNull();
    });

    it('liveAnnouncement success arm announces selectedTab with nextTab prefix on forward nav', () => {
      // Pillar 2 — every state change reaches AT, including the
      // success transition. Without this binding the live region
      // collapsed back to empty after a successful commit, leaving
      // mouse-only sighted users with feedback (the active tab visibly
      // changed) but AT users with silence on the navigation outcome.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => true;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      const region = fixture.nativeElement.querySelector(
        '.cngx-tabs__live-region',
      ) as HTMLElement;
      // Forward nav — 0 → 2. Direction prefix uses i18n.nextTab.
      tabs[2].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('Next tab: Tab 3 of 3: C');
    });

    it('liveAnnouncement success arm prepends previousTab on backward nav', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(CommitHost);
      fixture.componentInstance.mode = 'optimistic';
      fixture.componentInstance.action = () => true;
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      const region = fixture.nativeElement.querySelector(
        '.cngx-tabs__live-region',
      ) as HTMLElement;
      // Move forward first so the next backward step has a prior > new.
      tabs[2].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('Next tab: Tab 3 of 3: C');
      // Backward nav — 2 → 0. Direction prefix uses i18n.previousTab.
      tabs[0].click();
      fixture.detectChanges();
      expect(region.textContent?.trim()).toBe('Previous tab: Tab 1 of 3: A');
    });
  });

  it('scrolls the active tab button into view when activeId changes', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button[role="tab"]',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const calls: HTMLButtonElement[] = [];
    for (const btn of tabs) {
      Object.defineProperty(btn, 'scrollIntoView', {
        configurable: true,
        writable: true,
        value: () => calls.push(btn),
      });
    }
    tabs[2].click();
    fixture.detectChanges();
    expect(calls).toContain(tabs[2]);
  });

  it('per-panel aria-roledescription reflects fallbackLabels.tabPanelRoleDescription', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(
          withTabsFallbackLabels({ tabPanelRoleDescription: 'Bereichspanel' }),
        ),
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab, CngxTabContent],
      template: `
        <cngx-tab-group aria-label="X">
          <div cngxTab [label]="'A'">
            <ng-template *cngxTabContent>A content</ng-template>
          </div>
        </cngx-tab-group>
      `,
    })
    class PanelDescHost {}
    const fixture = TestBed.createComponent(PanelDescHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      '[role="tabpanel"]',
    ) as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.getAttribute('aria-roledescription')).toBe('Bereichspanel');
  });

  it('per-panel aria-roledescription falls back to "tab panel" when unset', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab, CngxTabContent],
      template: `
        <cngx-tab-group aria-label="X">
          <div cngxTab [label]="'A'">
            <ng-template *cngxTabContent>A content</ng-template>
          </div>
        </cngx-tab-group>
      `,
    })
    class DefaultPanelDescHost {}
    const fixture = TestBed.createComponent(DefaultPanelDescHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      '[role="tabpanel"]',
    ) as HTMLElement;
    expect(panel.getAttribute('aria-roledescription')).toBe('tab panel');
  });

  it('aria-roledescription is reactive (config / i18n cascade)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'Reiter' })),
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group aria-label="X">
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class I18nHost {}
    const fixture = TestBed.createComponent(I18nHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    // tabsRoleDescription falls through fallbackLabels.tabRoleDescription
    // (library default 'tab list', the W3C ARIA tablist convention).
    // Override of i18n.tabsLabel does not change the role-description —
    // the fallbackLabels tier wins, AND the in-component fallback
    // (when fallbackLabels.tabRoleDescription is undefined) is also
    // 'tab list', deliberately distinct from i18n.tabsLabel. Pillar 2:
    // aria-label and aria-roledescription must never collide on the
    // same string.
    expect(host.getAttribute('aria-roledescription')).toBe('tab list');
  });

  it('aria-label and aria-roledescription do not collide when tabsRegion is localised', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Consumer localises the tabs landmark name — aria-label
        // resolves through `ariaLabels.tabsRegion`. aria-roledescription
        // must NOT pick up the same string; it stays at the W3C default
        // 'tab list'. Pre-fix, when `fallbackLabels.tabRoleDescription`
        // was unset (hand-rolled config bypassing `with*`), the
        // role-description cascade fell through to `i18n.tabsLabel` and
        // collapsed onto 'Bereiche' — Pillar 2 silent collision.
        provideCngxTabs(withTabsAriaLabels({ tabsRegion: 'Bereiche' })),
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group>
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class CollisionHost {}
    const fixture = TestBed.createComponent(CollisionHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Bereiche');
    expect(host.getAttribute('aria-roledescription')).toBe('tab list');
    expect(host.getAttribute('aria-label')).not.toBe(
      host.getAttribute('aria-roledescription'),
    );
  });

  it('aria-roledescription stays "tab list" even when fallbackLabels is hand-rolled to omit tabRoleDescription', () => {
    // Closes the actual collision path: consumers who hand-roll a
    // CNGX_TABS_CONFIG provider that clears `fallbackLabels.
    // tabRoleDescription` previously fell through to
    // `i18n.tabsLabel`. Post-fix, the in-component fallback is
    // 'tab list' instead — collision impossible regardless of how
    // fallbackLabels was zeroed.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsConfig(withTabsAriaLabels({ tabsRegion: 'Bereiche' })),
        provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'Bereiche' })),
        // Override the resolved CNGX_TABS_CONFIG with one that has
        // `fallbackLabels` cleared — simulates a hand-rolled provider
        // that bypassed `withTabsFallbackLabels`.
        {
          provide: CNGX_TABS_CONFIG,
          useValue: {
            ariaLabels: { tabsRegion: 'Bereiche' },
          },
        },
      ],
    });
    @Component({
      standalone: true,
      imports: [CngxTabGroup, CngxTab],
      template: `
        <cngx-tab-group>
          <div cngxTab [label]="'A'"></div>
        </cngx-tab-group>
      `,
    })
    class HandRolledHost {}
    const fixture = TestBed.createComponent(HandRolledHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector(
      'cngx-tab-group',
    ) as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('Bereiche');
    expect(host.getAttribute('aria-roledescription')).toBe('tab list');
  });

  describe('skin-slot 3-stage cascade', () => {
    function aggregator(reveal = true): CngxErrorAggregatorContract {
      return {
        hasError: signal(true),
        errorCount: signal(1),
        activeErrors: signal<readonly string[]>([]),
        errorLabels: signal<readonly string[]>([]),
        shouldShow: signal(reveal),
        announcement: signal('1 error'),
        addSource: () => {},
        removeSource: () => {},
      };
    }

    it('errorBadgeContextFor returns a WeakMap-stable reference for the same tab handle', () => {
      // Reference-stability fence — *ngTemplateOutlet's input-diff
      // (via Object.is) short-circuits the embedded-view context-update
      // path only when the context REFERENCE is unchanged across CD
      // ticks. Per-CD allocation triggers the rebind path and thus the
      // perf concern documented at tabs-accepted-debt §9. The WeakMap
      // cache on errorBadgeContextFor must return the SAME object on
      // every call for a given tab handle.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
      const group = fixture.debugElement.query(
        (el) => el.componentInstance instanceof CngxTabGroup,
      ).componentInstance as unknown as {
        tabs: () => readonly { id: string }[];
        errorBadgeContextFor: (tab: unknown) => unknown;
      };
      const handles = group.tabs();
      const ctx1 = group.errorBadgeContextFor(handles[0]);
      const ctx2 = group.errorBadgeContextFor(handles[0]);
      expect(ctx1).toBe(ctx2);
      // Different tab handle → different cached context (WeakMap key).
      const ctxOther = group.errorBadgeContextFor(handles[1]);
      expect(ctxOther).not.toBe(ctx1);
    });

    it('per-instance *cngxTabErrorBadge wins over the built-in default', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab, CngxTabErrorBadge],
        template: `
          <cngx-tab-group aria-label="X">
            <ng-template cngxTabErrorBadge let-tab="tab">
              <span data-testid="custom-badge">{{ tab.id }}-bad</span>
            </ng-template>
            <div cngxTab [label]="'A'" [errorAggregator]="agg"></div>
          </cngx-tab-group>
        `,
      })
      class CustomBadgeHost {
        agg = aggregator(true);
      }
      const fixture = TestBed.createComponent(CustomBadgeHost);
      fixture.detectChanges();
      const tab = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      const custom = tab.querySelector(
        '[data-testid="custom-badge"]',
      ) as HTMLElement;
      expect(custom).not.toBeNull();
      expect(custom.textContent).toContain('-bad');
      // Default span no longer renders.
      expect(tab.querySelector('.cngx-tabs__badge')).toBeNull();
    });

    it('CNGX_TABS_CONFIG.templates.errorBadge wins over the built-in default when no per-instance directive is bound', () => {
      TestBed.resetTestingModule();
      @Component({
        standalone: true,
        template: `<ng-template #cfgTpl><span data-testid="cfg-badge">cfg</span></ng-template>`,
      })
      class TplFactory {
        @ViewChild('cfgTpl', { static: true })
        cfgTpl!: TemplateRef<unknown>;
      }
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const tplFixture = TestBed.createComponent(TplFactory);
      tplFixture.detectChanges();
      const cfgTpl = tplFixture.componentInstance.cfgTpl;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(
            withTabErrorBadgeTemplate(
              cfgTpl as unknown as TemplateRef<CngxTabErrorBadgeContext>,
            ),
          ),
        ],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab],
        template: `
          <cngx-tab-group aria-label="X">
            <div cngxTab [label]="'A'" [errorAggregator]="agg"></div>
          </cngx-tab-group>
        `,
      })
      class ConfigBadgeHost {
        agg = aggregator(true);
      }
      const fixture = TestBed.createComponent(ConfigBadgeHost);
      fixture.detectChanges();
      const tab = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      const custom = tab.querySelector(
        '[data-testid="cfg-badge"]',
      ) as HTMLElement;
      expect(custom).not.toBeNull();
      // Default span no longer renders when config template is bound.
      expect(tab.querySelector('.cngx-tabs__badge')).toBeNull();
    });

    it('per-instance directive wins over CNGX_TABS_CONFIG.templates entry', () => {
      TestBed.resetTestingModule();
      @Component({
        standalone: true,
        template: `<ng-template #cfgTpl><span data-testid="cfg-badge">cfg</span></ng-template>`,
      })
      class TplFactory {
        @ViewChild('cfgTpl', { static: true })
        cfgTpl!: TemplateRef<unknown>;
      }
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const tplFixture = TestBed.createComponent(TplFactory);
      tplFixture.detectChanges();
      const cfgTpl = tplFixture.componentInstance.cfgTpl;
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTabsConfig(
            withTabErrorBadgeTemplate(
              cfgTpl as unknown as TemplateRef<CngxTabErrorBadgeContext>,
            ),
          ),
        ],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab, CngxTabErrorBadge],
        template: `
          <cngx-tab-group aria-label="X">
            <ng-template cngxTabErrorBadge>
              <span data-testid="instance-badge">instance</span>
            </ng-template>
            <div cngxTab [label]="'A'" [errorAggregator]="agg"></div>
          </cngx-tab-group>
        `,
      })
      class WinHost {
        agg = aggregator(true);
      }
      const fixture = TestBed.createComponent(WinHost);
      fixture.detectChanges();
      const tab = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      expect(tab.querySelector('[data-testid="instance-badge"]')).not.toBeNull();
      expect(tab.querySelector('[data-testid="cfg-badge"]')).toBeNull();
    });

    it('built-in default span renders when neither slot nor config template is bound', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab],
        template: `
          <cngx-tab-group aria-label="X">
            <div cngxTab [label]="'A'" [errorAggregator]="agg"></div>
          </cngx-tab-group>
        `,
      })
      class DefaultHost {
        agg = aggregator(true);
      }
      const fixture = TestBed.createComponent(DefaultHost);
      fixture.detectChanges();
      const tab = fixture.nativeElement.querySelector(
        'button[role="tab"]',
      ) as HTMLButtonElement;
      const span = tab.querySelector('.cngx-tabs__badge') as HTMLElement;
      expect(span).not.toBeNull();
      expect(span.textContent?.trim()).toBe('!');
    });

    it('per-instance *cngxTabRejectionIcon receives failedIndex + originLabel context', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab, CngxTabRejectionIcon],
        template: `
          <cngx-tab-group
            aria-label="X"
            [commitAction]="action"
            commitMode="optimistic"
          >
            <ng-template
              cngxTabRejectionIcon
              let-failedIndex="failedIndex"
              let-originLabel="originLabel"
            >
              <span data-testid="custom-rej">{{ failedIndex }}@if (originLabel) { →{{ originLabel }} }</span>
            </ng-template>
            <div cngxTab [label]="'A'"></div>
            <div cngxTab [label]="'B'"></div>
            <div cngxTab [label]="'C'"></div>
          </cngx-tab-group>
        `,
      })
      class CustomRejHost {
        action: CngxTabsCommitAction | null = () => false;
      }
      const fixture = TestBed.createComponent(CustomRejHost);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      const custom = tabs[2].querySelector(
        '[data-testid="custom-rej"]',
      ) as HTMLElement;
      expect(custom).not.toBeNull();
      expect(custom.textContent?.replace(/\s+/g, '')).toContain('2→A');
      // Default rejection-icon span suppressed.
      expect(tabs[2].querySelector('.cngx-tabs__rejection-icon')).toBeNull();
    });

    it('per-instance *cngxTabBusySpinner receives tab + intendedIndex context', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      @Component({
        standalone: true,
        imports: [CngxTabGroup, CngxTab, CngxTabBusySpinner],
        template: `
          <cngx-tab-group
            aria-label="X"
            [commitAction]="action"
            commitMode="pessimistic"
          >
            <ng-template
              cngxTabBusySpinner
              let-tab="tab"
              let-intendedIndex="intendedIndex"
            >
              <span data-testid="custom-spin">{{ tab.id }}@{{ intendedIndex }}</span>
            </ng-template>
            <div cngxTab [label]="'A'"></div>
            <div cngxTab [label]="'B'"></div>
            <div cngxTab [label]="'C'"></div>
          </cngx-tab-group>
        `,
      })
      class CustomSpinHost {
        action: CngxTabsCommitAction | null = () =>
          new Promise<boolean>(() => undefined);
      }
      const fixture = TestBed.createComponent(CustomSpinHost);
      fixture.detectChanges();
      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[role="tab"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
      tabs[2].click();
      fixture.detectChanges();
      const custom = tabs[2].querySelector(
        '[data-testid="custom-spin"]',
      ) as HTMLElement;
      expect(custom).not.toBeNull();
      // Tab id default is `cngx-tab-N` (presenter auto-id) — assert the
      // intendedIndex segment instead which is a stable integer.
      expect(custom.textContent).toContain('@2');
      // Default spinner span suppressed.
      expect(tabs[2].querySelector('.cngx-tabs__busy-spinner')).toBeNull();
    });
  });
});
