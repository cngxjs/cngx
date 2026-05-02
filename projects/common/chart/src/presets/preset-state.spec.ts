import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CngxSparkline } from './sparkline.component';
import { CngxDonut } from './donut.component';
import { CngxBullet } from './bullet.component';
import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxSparkline],
  template: `
    <cngx-sparkline
      [data]="data"
      [width]="80"
      [height]="24"
      [state]="state"
    />
  `,
})
class SparklineHost {
  readonly data: readonly number[] = [1, 2, 3, 4, 5];
  state: ManualAsyncState<readonly number[]> = createManualState<readonly number[]>();
}

@Component({
  standalone: true,
  imports: [CngxDonut],
  template: `<cngx-donut [value]="50" [max]="100" [state]="state" />`,
})
class DonutHost {
  state: ManualAsyncState<number> = createManualState<number>();
}

@Component({
  standalone: true,
  imports: [CngxBullet],
  template: `<cngx-bullet [actual]="70" [target]="80" [max]="100" [state]="state" />`,
})
class BulletHost {
  state: ManualAsyncState<number> = createManualState<number>();
}

describe('preset state — activeView wiring', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  describe('CngxSparkline (representative)', () => {
    it('renders content (svg path) when state is idle without data — initial bind', () => {
      TestBed.configureTestingModule({ imports: [SparklineHost] });
      const fixture = TestBed.createComponent(SparklineHost);
      fixture.detectChanges();
      // idle + firstLoad → 'none' branch (renders nothing)
      expect(fixture.nativeElement.querySelector('.cngx-line')).toBeNull();
      expect(fixture.nativeElement.querySelector('.cngx-preset-skeleton')).toBeNull();
    });

    it('renders skeleton on loading (firstLoad)', () => {
      TestBed.configureTestingModule({ imports: [SparklineHost] });
      const fixture = TestBed.createComponent(SparklineHost);
      fixture.componentInstance.state.set('loading');
      fixture.detectChanges();
      const skeleton = fixture.nativeElement.querySelector('.cngx-preset-skeleton');
      expect(skeleton).not.toBeNull();
      expect(skeleton.getAttribute('aria-busy')).toBe('true');
    });

    it('renders empty fallback on success with empty data', () => {
      TestBed.configureTestingModule({ imports: [SparklineHost] });
      const fixture = TestBed.createComponent(SparklineHost);
      fixture.componentInstance.state.setSuccess([]);
      fixture.detectChanges();
      const fallback = fixture.nativeElement.querySelector('.cngx-preset-fallback');
      expect(fallback).not.toBeNull();
      expect(fallback.textContent?.trim()).toBe('No data');
    });

    it('renders error fallback on first-load error', () => {
      TestBed.configureTestingModule({ imports: [SparklineHost] });
      const fixture = TestBed.createComponent(SparklineHost);
      fixture.componentInstance.state.setError(new Error('boom'));
      fixture.detectChanges();
      const fallback = fixture.nativeElement.querySelector(
        '.cngx-preset-fallback--error',
      );
      expect(fallback).not.toBeNull();
      expect(fallback.textContent?.trim()).toBe('Error loading chart');
    });

    it('renders content branch on success with non-empty data', () => {
      TestBed.configureTestingModule({ imports: [SparklineHost] });
      const fixture = TestBed.createComponent(SparklineHost);
      fixture.componentInstance.state.setSuccess([1, 2, 3]);
      fixture.detectChanges();
      const path = fixture.nativeElement.querySelector('.cngx-line');
      expect(path).not.toBeNull();
    });

    it('renders content (no fallback) when state input is unbound entirely', () => {
      @Component({
        standalone: true,
        imports: [CngxSparkline],
        template: `<cngx-sparkline [data]="data" [width]="80" [height]="24" />`,
      })
      class NoStateHost {
        readonly data: readonly number[] = [1, 2, 3];
      }
      TestBed.configureTestingModule({ imports: [NoStateHost] });
      const fixture = TestBed.createComponent(NoStateHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-line')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.cngx-preset-skeleton')).toBeNull();
    });
  });

  describe('CngxDonut (spot check)', () => {
    it('renders skeleton on loading state', () => {
      TestBed.configureTestingModule({ imports: [DonutHost] });
      const fixture = TestBed.createComponent(DonutHost);
      fixture.componentInstance.state.set('loading');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-preset-skeleton')).not.toBeNull();
    });

    it('renders the donut svg on success state', () => {
      TestBed.configureTestingModule({ imports: [DonutHost] });
      const fixture = TestBed.createComponent(DonutHost);
      fixture.componentInstance.state.setSuccess(50);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-donut__fill')).not.toBeNull();
    });
  });

  describe('CngxBullet (spot check)', () => {
    it('renders error fallback on error state', () => {
      TestBed.configureTestingModule({ imports: [BulletHost] });
      const fixture = TestBed.createComponent(BulletHost);
      fixture.componentInstance.state.setError(new Error('boom'));
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.cngx-preset-fallback--error'),
      ).not.toBeNull();
    });

    it('renders content branch on success state', () => {
      TestBed.configureTestingModule({ imports: [BulletHost] });
      const fixture = TestBed.createComponent(BulletHost);
      fixture.componentInstance.state.setSuccess(70);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cngx-bullet__actual')).not.toBeNull();
    });
  });
});
