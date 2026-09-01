import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxStatCoordinator } from './stat-coordinator.directive';
import { CngxStatCaption, CngxStatDelta, CngxStatLabel, CngxStatValue } from './stat-slots';
import { CNGX_STAT } from './stat.token';

/**
 * Stand-in for an organism that hosts the four stat slots without rendering a
 * `<cngx-stat>` - the shape `CngxStatCard` uses. The slots are declared in the
 * consumer template below, so they can only resolve `CNGX_STAT` if this host
 * provides it.
 */
@Component({
  selector: 'stat-carrier',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [CngxStatCoordinator],
  providers: [{ provide: CNGX_STAT, useExisting: CngxStatCoordinator }],
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'coordinator.labelledBy()',
  },
  template: `<ng-content />`,
})
class StatCarrier {
  protected readonly coordinator = inject(CngxStatCoordinator, { host: true });
}

@Component({
  standalone: true,
  imports: [StatCarrier, CngxStatLabel, CngxStatValue, CngxStatDelta, CngxStatCaption],
  template: `
    <stat-carrier>
      <span cngxStatLabel>Revenue</span>
      <span cngxStatValue>1.2M</span>
      @if (showDelta()) {
        <span cngxStatDelta>+5.3%</span>
      }
      <span cngxStatCaption>vs last quarter</span>
    </stat-carrier>
  `,
})
class TestHost {
  showDelta = signal(true);
}

describe('CngxStatCoordinator', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const carrier: HTMLElement = fixture.nativeElement.querySelector('stat-carrier');
    return { fixture, carrier, host: fixture.componentInstance };
  }

  function labelledIds(el: HTMLElement): string[] {
    return (el.getAttribute('aria-labelledby') ?? '').split(' ').filter(Boolean);
  }

  it('collects slots declared in a consumer template, not inside a cngx-stat', () => {
    const { carrier } = setup();
    const expected = [
      carrier.querySelector('[cngxStatLabel]')!.id,
      carrier.querySelector('[cngxStatValue]')!.id,
      carrier.querySelector('[cngxStatDelta]')!.id,
      carrier.querySelector('[cngxStatCaption]')!.id,
    ];
    expect(expected.every(Boolean)).toBe(true);
    expect(labelledIds(carrier)).toEqual(expected);
  });

  it('withdraws an id when its slot is destroyed', () => {
    const { fixture, carrier, host } = setup();
    host.showDelta.set(false);
    fixture.detectChanges();
    expect(carrier.querySelector('[cngxStatDelta]')).toBeNull();
    expect(labelledIds(carrier)).toEqual([
      carrier.querySelector('[cngxStatLabel]')!.id,
      carrier.querySelector('[cngxStatValue]')!.id,
      carrier.querySelector('[cngxStatCaption]')!.id,
    ]);
  });

  it('keeps the ordered-id reference stable across an unrelated re-render', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const coordinator = fixture.debugElement
      .query((node) => node.name === 'stat-carrier')
      .injector.get(CngxStatCoordinator);

    const before = coordinator.orderedIds();
    fixture.detectChanges();
    expect(coordinator.orderedIds()).toBe(before);
  });

  it('reports no accessible name while no slot has registered', () => {
    const coordinator = TestBed.runInInjectionContext(() => new CngxStatCoordinator());
    expect(coordinator.labelledBy()).toBeNull();
    expect(coordinator.orderedIds()).toEqual([]);
  });

  it('a stale unregister does not evict a live same-kind replacement', () => {
    const coordinator = TestBed.runInInjectionContext(() => new CngxStatCoordinator());
    coordinator.register('label', 'old-id');
    // Register-before-destroy: the replacement lands before the old slot
    // tears down.
    coordinator.register('label', 'new-id');
    coordinator.unregister('label', 'old-id');
    expect(coordinator.orderedIds()).toEqual(['new-id']);
  });

  it('an id-less unregister keeps the legacy unconditional behavior', () => {
    const coordinator = TestBed.runInInjectionContext(() => new CngxStatCoordinator());
    coordinator.register('label', 'id-1');
    coordinator.unregister('label');
    expect(coordinator.orderedIds()).toEqual([]);
  });
});
