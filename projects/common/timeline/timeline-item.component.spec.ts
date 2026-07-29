import { Component, computed, forwardRef, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import type { AsyncStatus } from '@cngx/core/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_TIMELINE_MARKER_HOST } from './marker-host.token';
import {
  CngxTimelineItem,
  CngxTimelineMarkerContent,
  CngxTimelineOpposite,
  CngxTimelineTime,
} from './timeline-item.component';
import { provideTimelineConfig, withTimelineLabels } from './timeline-config';

const ALL_STATUSES: readonly AsyncStatus[] = [
  'idle',
  'loading',
  'pending',
  'refreshing',
  'success',
  'error',
];

@Component({
  selector: 'cngx-timeline-item-host',
  standalone: true,
  imports: [CngxTimelineItem, CngxTimelineTime],
  template: `
    <cngx-timeline-item [status]="status()" [state]="state()" [position]="position()">
      <span cngxTimelineTime>12:04</span>
      <p class="body">Deployment finished</p>
    </cngx-timeline-item>
  `,
})
class Host {
  readonly status = signal<'done' | 'active' | 'upcoming' | 'rejected' | undefined>(undefined);
  readonly state = signal<ReturnType<typeof createManualState<string>> | undefined>(undefined);
  readonly position = signal<'middle' | 'first' | 'last' | 'only'>('middle');
}

function mount(): {
  host: Host;
  item: HTMLElement;
  detect: () => void;
} {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const item = root.querySelector('cngx-timeline-item');
  if (!item) {
    throw new Error('cngx-timeline-item did not render');
  }
  return {
    host: fixture.componentInstance,
    item: item as HTMLElement,
    detect: () => fixture.detectChanges(),
  };
}

/** Screen-reader status line, present only while there is a status to read. */
function statusLine(item: HTMLElement): HTMLElement | null {
  return item.querySelector('.cngx-timeline-item__sr');
}

/** Inline error, present only while this row's own state has failed. */
function inlineError(item: HTMLElement): HTMLElement | null {
  return item.querySelector('.cngx-timeline-item__error');
}

describe('CngxTimelineItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  describe('standalone completeness', () => {
    it('renders marker, rail, timestamp and body with no organism above it', () => {
      const { item } = mount();

      expect(item.querySelector('cngx-timeline-marker')).not.toBeNull();
      expect(item.querySelector('cngx-timeline-connector')).not.toBeNull();
      expect(item.querySelector('.cngx-timeline-item__time')?.textContent).toContain('12:04');
      expect(item.querySelector('.body')?.textContent).toContain('Deployment finished');
    });

    it('sets no data-mode of its own, so the narrative raster is the host default', () => {
      const { item } = mount();

      expect(item.hasAttribute('data-mode')).toBe(false);
      expect(item.closest('[data-mode]')).toBeNull();
    });

    it('forwards position to the rail', () => {
      const { item, host, detect } = mount();

      host.position.set('last');
      detect();

      expect(item.querySelector('cngx-timeline-connector')?.getAttribute('data-position')).toBe(
        'last',
      );
    });
  });

  describe('announcement surfaces', () => {
    it.each(ALL_STATUSES)(
      'reads its status as row content in every state, including "%s"',
      (status) => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        host.status.set('done');
        detect();

        state.set(status);
        detect();

        // Busy states swap the wording; every state still says something.
        expect(statusLine(item)?.textContent?.trim()).not.toBe('');
      },
    );

    it('carries no aria-describedby - the host has no role for one to resolve against', () => {
      const { item } = mount();

      expect(item.hasAttribute('aria-describedby')).toBe(false);
    });

    it('renders no inline error until this row fails', () => {
      const { item } = mount();

      expect(inlineError(item)).toBeNull();
    });
  });

  describe('status announcement', () => {
    it('renders no status line when no status is set', () => {
      const { item } = mount();

      expect(statusLine(item)).toBeNull();
    });

    it.each([
      ['done', 'Completed'],
      ['active', 'In progress'],
      ['upcoming', 'Upcoming'],
      ['rejected', 'Rejected'],
    ] as const)('announces "%s" as "%s" from the config cascade', (status, text) => {
      const { item, host, detect } = mount();

      host.status.set(status);
      detect();

      expect(statusLine(item)?.textContent?.trim()).toBe(text);
    });

    it('reflects the status onto data-status for the visual channel', () => {
      const { item, host, detect } = mount();

      host.status.set('upcoming');
      detect();

      expect(item.getAttribute('data-status')).toBe('upcoming');
      expect(item.querySelector('cngx-timeline-marker')?.getAttribute('data-status')).toBe(
        'upcoming',
      );
    });

    it('takes the wording from a consumer override', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [provideTimelineConfig(withTimelineLabels({ status: { done: 'Erledigt' } }))],
      });
      const { item, host, detect } = mount();

      host.status.set('done');
      detect();

      expect(statusLine(item)?.textContent?.trim()).toBe('Erledigt');
    });

    it('leaves the statuses a partial override did not name at their defaults', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Host],
        providers: [provideTimelineConfig(withTimelineLabels({ status: { done: 'Erledigt' } }))],
      });
      const { item, host, detect } = mount();

      host.status.set('rejected');
      detect();

      expect(statusLine(item)?.textContent?.trim()).toBe('Rejected');
    });
  });

  /**
   * A row under a timeline that does offer a marker template, so the two
   * tiers are genuinely in competition. `project` decides whether the row
   * also carries its own `[cngxTimelineMarkerContent]`.
   */
  function mountMarkerHost(project: boolean): { marker: Element | null } {
    @Component({
      selector: 'cngx-timeline-marker-host-host',
      standalone: true,
      imports: [CngxTimelineItem, CngxTimelineMarkerContent],
      template: `
        <ng-template #wide let-status="status">TPL:{{ status }}</ng-template>
        <cngx-timeline-item status="done" [item]="{ id: 1 }">
          @if (project) {
            <span cngxTimelineMarkerContent>PROJECTED</span>
          }
        </cngx-timeline-item>
      `,
      providers: [
        {
          provide: CNGX_TIMELINE_MARKER_HOST,
          useExisting: forwardRef(() => MarkerHostHost),
        },
      ],
    })
    class MarkerHostHost {
      readonly project = project;
      private readonly wide = viewChild('wide', { read: TemplateRef });
      readonly markerTpl = computed(() => this.wide() ?? null);
    }

    TestBed.configureTestingModule({ imports: [MarkerHostHost] });
    const fixture = TestBed.createComponent(MarkerHostHost);
    // Twice: the template ref resolves on view init, so the first pass has
    // nothing for the marker host to hand down yet.
    fixture.detectChanges();
    fixture.detectChanges();

    return {
      marker: (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-marker'),
    };
  }

  describe('marker content', () => {
    it('projects [cngxTimelineMarkerContent] into the dot when standing alone', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-marker-content-host',
        standalone: true,
        imports: [CngxTimelineItem, CngxTimelineMarkerContent],
        template: `
          <cngx-timeline-item status="done">
            <span cngxTimelineMarkerContent>OK</span>
          </cngx-timeline-item>
        `,
      })
      class MarkerHost {}

      TestBed.configureTestingModule({ imports: [MarkerHost] });
      const fixture = TestBed.createComponent(MarkerHost);
      fixture.detectChanges();
      const marker = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-marker');

      expect(marker?.textContent).toContain('OK');
    });

    it('renders the timeline-wide template when the row projects nothing', () => {
      TestBed.resetTestingModule();
      const { marker } = mountMarkerHost(false);

      expect(marker?.textContent).toContain('TPL:done');
    });

    it('lets a row that projects its own content win over the timeline-wide template', () => {
      TestBed.resetTestingModule();
      const { marker } = mountMarkerHost(true);

      // Most-local-wins: one row swaps its glyph without tearing the
      // timeline's default out for every other row.
      expect(marker?.textContent).toContain('PROJECTED');
      expect(marker?.textContent).not.toContain('TPL:');
    });
  });

  /**
   * Structure only. The raster the slot unlocks is verified in
   * `e2e/timeline-layout.spec.ts`: the row grid lives inside `@layer` and
   * `@scope`, neither of which jsdom's CSSOM parses, so
   * `getComputedStyle(row).gridTemplateColumns` is `''` here for the gated
   * and the ungated case alike - an assertion on it would pass whatever
   * the stylesheet says.
   */
  describe('opposite slot', () => {
    it('projects [cngxTimelineOpposite] into its own element', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-opposite-host',
        standalone: true,
        imports: [CngxTimelineItem, CngxTimelineOpposite],
        template: `
          <cngx-timeline-item status="done">
            <span cngxTimelineOpposite>2019</span>
            <p>Founded</p>
          </cngx-timeline-item>
        `,
      })
      class OppositeHost {}

      TestBed.configureTestingModule({ imports: [OppositeHost] });
      const fixture = TestBed.createComponent(OppositeHost);
      fixture.detectChanges();
      const item = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-item');

      expect(item?.querySelector('.cngx-timeline-item__opposite')?.textContent).toContain('2019');
    });

    it('renders no opposite element for a row that projects none', () => {
      const { item } = mount();

      expect(item.querySelector('.cngx-timeline-item__opposite')).toBeNull();
    });

    /**
     * The slot projects ahead of the body, so its reading order is fixed
     * while its paint follows `[data-row-side]`. Under `end` / `alternate`
     * a focusable child would take focus before the row it belongs to, and
     * no grid placement can fix that - so the constraint gets a dev signal
     * rather than only a line in the README.
     */
    describe('non-interactive contract', () => {
      function mountOpposite(content: 'link' | 'label'): void {
        TestBed.resetTestingModule();

        @Component({
          selector: 'cngx-timeline-opposite-focus-host',
          standalone: true,
          imports: [CngxTimelineItem, CngxTimelineOpposite],
          template: `
            <cngx-timeline-item>
              <span cngxTimelineOpposite>
                @if (isLink) {
                  <a href="#somewhere">2019</a>
                } @else {
                  2019
                }
              </span>
              <p>Founded</p>
            </cngx-timeline-item>
          `,
        })
        class OppositeFocusHost {
          readonly isLink = content === 'link';
        }

        TestBed.configureTestingModule({ imports: [OppositeFocusHost] });
        const fixture = TestBed.createComponent(OppositeFocusHost);
        fixture.detectChanges();
        TestBed.tick();
      }

      function warnings(spy: { mock: { calls: readonly unknown[][] } }): number {
        return spy.mock.calls.filter((call) =>
          String(call[0]).includes('focusable content inside [cngxTimelineOpposite]'),
        ).length;
      }

      it('warns once when the slot holds something focusable', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        mountOpposite('link');

        expect(warnings(warn)).toBe(1);
        warn.mockRestore();
      });

      it('stays silent for a plain label, which is what the slot is for', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        mountOpposite('label');

        expect(warnings(warn)).toBe(0);
        warn.mockRestore();
      });

      it('stays silent for a row that projects no opposite content at all', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        mount();
        TestBed.tick();

        expect(warnings(warn)).toBe(0);
        warn.mockRestore();
      });
    });

    it('keeps opposite content out of the body, so the body raster is unchanged', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-opposite-body-host',
        standalone: true,
        imports: [CngxTimelineItem, CngxTimelineOpposite],
        template: `
          <cngx-timeline-item>
            <span cngxTimelineOpposite>2019</span>
            <p class="body">Founded</p>
          </cngx-timeline-item>
        `,
      })
      class OppositeBodyHost {}

      TestBed.configureTestingModule({ imports: [OppositeBodyHost] });
      const fixture = TestBed.createComponent(OppositeBodyHost);
      fixture.detectChanges();
      const body = (fixture.nativeElement as HTMLElement).querySelector(
        '.cngx-timeline-item__body',
      );

      expect(body?.querySelector('.body')).not.toBeNull();
      expect(body?.querySelector('.cngx-timeline-item__opposite')).toBeNull();
    });
  });

  describe('per-item async state', () => {
    it('leaves aria-busy off with no state bound', () => {
      const { item } = mount();

      expect(item.hasAttribute('aria-busy')).toBe(false);
    });

    it('tolerates a bare state attribute without a binding', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-bare-host',
        standalone: true,
        imports: [CngxTimelineItem],
        template: `<cngx-timeline-item state />`,
      })
      class BareHost {}

      TestBed.configureTestingModule({ imports: [BareHost] });
      const fixture = TestBed.createComponent(BareHost);
      fixture.detectChanges();
      const item = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-item');

      expect(item?.hasAttribute('aria-busy')).toBe(false);
    });

    it.each<[AsyncStatus, boolean]>([
      ['idle', false],
      ['loading', true],
      ['pending', true],
      ['refreshing', false],
      ['success', false],
      ['error', false],
    ])('sets aria-busy to %s -> %s', (status, busy) => {
      const { item, host, detect } = mount();
      const state = createManualState<string>();
      host.state.set(state);
      detect();

      state.set(status);
      detect();

      expect(item.getAttribute('aria-busy')).toBe(busy ? 'true' : null);
    });

    it('pulses the marker only while the row is busy', () => {
      const { item, host, detect } = mount();
      const state = createManualState<string>();
      host.state.set(state);
      detect();

      state.set('pending');
      detect();
      const marker = item.querySelector('cngx-timeline-marker');
      expect(marker?.classList.contains('cngx-timeline-marker--busy')).toBe(true);

      state.setSuccess('ok');
      detect();
      expect(marker?.classList.contains('cngx-timeline-marker--busy')).toBe(false);
    });

    it('announces the busy label instead of the status while loading', () => {
      const { item, host, detect } = mount();
      const state = createManualState<string>();
      host.state.set(state);
      host.status.set('done');
      detect();

      state.set('pending');
      detect();

      expect(statusLine(item)?.textContent?.trim()).toBe('Updating');
    });

    describe('failure', () => {
      it('shows the inline error and drops it again on recovery', () => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        detect();

        expect(inlineError(item)).toBeNull();

        state.setError(new Error('boom'));
        detect();
        expect(inlineError(item)?.textContent?.trim()).toBe('Could not load this event.');

        state.setSuccess('ok');
        detect();
        expect(inlineError(item)).toBeNull();
      });

      it('repaints marker and rail as rejected without discarding the editorial status', () => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        host.status.set('done');
        detect();

        state.setError(new Error('boom'));
        detect();

        expect(item.getAttribute('data-status')).toBe('done');
        expect(item.hasAttribute('data-failed')).toBe(true);
        expect(item.querySelector('cngx-timeline-marker')?.getAttribute('data-status')).toBe(
          'rejected',
        );
        expect(item.querySelector('cngx-timeline-connector')?.getAttribute('data-status')).toBe(
          'rejected',
        );
      });

      it('announces what it paints rather than the editorial status it kept', () => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        host.status.set('done');
        detect();

        expect(statusLine(item)?.textContent?.trim()).toBe('Completed');

        state.setError(new Error('boom'));
        detect();

        expect(statusLine(item)?.textContent?.trim()).toBe('Rejected');

        state.setSuccess('ok');
        detect();
        expect(statusLine(item)?.textContent?.trim()).toBe('Completed');
      });

      it('returns to the editorial colour once a retry succeeds', () => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        host.status.set('done');
        detect();

        state.setError(new Error('boom'));
        detect();
        state.setSuccess('ok');
        detect();

        expect(item.hasAttribute('data-failed')).toBe(false);
        expect(item.querySelector('cngx-timeline-marker')?.getAttribute('data-status')).toBe(
          'done',
        );
      });
    });
  });
});
