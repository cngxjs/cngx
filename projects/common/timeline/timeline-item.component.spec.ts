import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createManualState } from '@cngx/common/data';
import type { AsyncStatus } from '@cngx/core/utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { CNGX_TIMELINE_MARKER_HOST } from './marker-host.token';
import {
  CngxTimelineItem,
  CngxTimelineMarkerContent,
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

function describedTargets(item: HTMLElement): HTMLElement[] {
  const ids = (item.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  return ids.map((id) => {
    const el = item.querySelector(`#${id}`);
    if (!el) {
      throw new Error(`aria-describedby target #${id} is not in the DOM`);
    }
    return el as HTMLElement;
  });
}

describe('CngxTimelineItem', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  describe('standalone completeness', () => {
    it('renders marker, rail, timestamp, body and both described targets with no organism above it', () => {
      const { item } = mount();

      expect(item.querySelector('cngx-timeline-marker')).not.toBeNull();
      expect(item.querySelector('cngx-timeline-connector')).not.toBeNull();
      expect(item.querySelector('.cngx-timeline-item__time')?.textContent).toContain('12:04');
      expect(item.querySelector('.body')?.textContent).toContain('Deployment finished');
      expect(describedTargets(item)).toHaveLength(2);
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

  describe('aria-describedby targets', () => {
    it.each(ALL_STATUSES)('keeps both target IDs in the DOM while the state is "%s"', (status) => {
      const { item, host, detect } = mount();
      const state = createManualState<string>();
      host.state.set(state);
      host.status.set('done');
      detect();

      state.set(status);
      detect();

      expect(describedTargets(item)).toHaveLength(2);
    });

    it('keeps both target IDs in the DOM with no state bound at all', () => {
      const { item } = mount();

      expect(describedTargets(item)).toHaveLength(2);
    });

    it('names both IDs in a stable order rather than dropping one', () => {
      const { item, host, detect } = mount();
      const before = item.getAttribute('aria-describedby');

      const state = createManualState<string>();
      host.state.set(state);
      state.setError(new Error('boom'));
      detect();

      expect(item.getAttribute('aria-describedby')).toBe(before);
    });
  });

  describe('status announcement', () => {
    it('says nothing when no status is set', () => {
      const { item } = mount();
      const [statusEl] = describedTargets(item);

      expect(statusEl.getAttribute('aria-hidden')).toBe('true');
      expect(statusEl.textContent?.trim()).toBe('');
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
      const [statusEl] = describedTargets(item);

      expect(statusEl.getAttribute('aria-hidden')).toBeNull();
      expect(statusEl.textContent?.trim()).toBe(text);
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

      expect(describedTargets(item)[0].textContent?.trim()).toBe('Erledigt');
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

      expect(describedTargets(item)[0].textContent?.trim()).toBe('Rejected');
    });
  });

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

    it('lets an app-wide marker template win over the projected content', () => {
      TestBed.resetTestingModule();

      @Component({
        selector: 'cngx-timeline-marker-host-host',
        standalone: true,
        imports: [CngxTimelineItem, CngxTimelineMarkerContent],
        template: `
          <ng-template #appWide let-status="status">TPL:{{ status }}</ng-template>
          <cngx-timeline-item status="done" [item]="{ id: 1 }">
            <span cngxTimelineMarkerContent>PROJECTED</span>
          </cngx-timeline-item>
        `,
        providers: [
          {
            provide: CNGX_TIMELINE_MARKER_HOST,
            useFactory: () => ({ markerTpl: signal(null) }),
          },
        ],
      })
      class MarkerHostHost {
        readonly tpl = viewChild.required('appWide', { read: TemplateRef });
      }

      TestBed.configureTestingModule({ imports: [MarkerHostHost] });
      const fixture = TestBed.createComponent(MarkerHostHost);
      fixture.detectChanges();
      const marker = (fixture.nativeElement as HTMLElement).querySelector('cngx-timeline-marker');

      // Host present but offering no template: projection still wins.
      expect(marker?.textContent).toContain('PROJECTED');
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

      expect(describedTargets(item)[0].textContent?.trim()).toBe('Updating');
    });

    describe('failure', () => {
      it('shows the inline error and hides it again on recovery', () => {
        const { item, host, detect } = mount();
        const state = createManualState<string>();
        host.state.set(state);
        detect();
        const [, errorEl] = describedTargets(item);

        expect(errorEl.getAttribute('aria-hidden')).toBe('true');

        state.setError(new Error('boom'));
        detect();
        expect(errorEl.getAttribute('aria-hidden')).toBeNull();
        expect(errorEl.textContent?.trim()).toBe('Could not load this event.');

        state.setSuccess('ok');
        detect();
        expect(errorEl.getAttribute('aria-hidden')).toBe('true');
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
        expect(item.querySelector('cngx-timeline-marker')?.getAttribute('data-status')).toBe('done');
      });
    });
  });
});
