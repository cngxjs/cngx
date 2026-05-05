import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import {
  CngxTab,
  CngxTabContent,
  CngxTabLabel,
  provideTabsConfig,
  provideTabsI18n,
  withDefaultOrientation,
  withTabsAriaLabels,
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
        provideTabsConfig(withDefaultOrientation('vertical')),
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
      expect(region.textContent?.trim()).toBe('Saving…');
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

    it('error transition surfaces commitFailedRetry on the live region', () => {
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
      // Pending → error transition lands the retry phrase.
      expect(region.textContent?.trim()).toBe('Commit failed — retry?');
    });
  });

  it('aria-roledescription is reactive (config / i18n cascade)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTabsI18n({ tabsLabel: 'Reiter' }),
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
    // which defaults to 'tab'. Override of i18n.tabsLabel does not
    // change the role-description because the fallbackLabels tier
    // wins. Pin the current behaviour.
    expect(host.getAttribute('aria-roledescription')).toBe('tab');
  });
});
