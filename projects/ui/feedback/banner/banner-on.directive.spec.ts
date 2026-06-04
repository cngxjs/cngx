import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CNGX_STATEFUL, type CngxStateful } from '@cngx/core/utils';

import { CngxBanner } from './banner.service';
import { CngxBannerOn } from './banner-on.directive';

@Component({
  selector: 'test-banner-explicit',
  template: `
    <div
      [cngxBannerOn]="state()"
      bannerId="test"
      bannerError="You are offline">
    </div>
  `,
  imports: [CngxBannerOn],
})
class ExplicitHost {
  readonly state = signal<ManualAsyncState<string> | undefined>(createManualState<string>());
}

@Component({
  selector: 'test-banner-fallback',
  template: `
    <div cngxBannerOn bannerId="test" bannerError="You are offline"></div>
  `,
  imports: [CngxBannerOn],
})
class FallbackHost {}

@Component({
  selector: 'test-banner-missing',
  template: `
    <div cngxBannerOn bannerId="test" bannerError="msg"></div>
  `,
  imports: [CngxBannerOn],
})
class MissingSourceHost {}

describe('CngxBannerOn', () => {
  it('uses explicit state input when provided', () => {
    TestBed.configureTestingModule({
      imports: [ExplicitHost],
      providers: [CngxBanner],
    });
    const banner = TestBed.inject(CngxBanner);
    const fixture = TestBed.createComponent(ExplicitHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const state = fixture.componentInstance.state()!;
    state.setError(new Error('boom'));
    TestBed.flushEffects();

    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].config.message).toBe('You are offline');
  });

  it('falls back to CNGX_STATEFUL when no state input is bound', () => {
    const tokenState = createManualState<string>();

    TestBed.configureTestingModule({
      imports: [FallbackHost],
      providers: [
        CngxBanner,
        { provide: CNGX_STATEFUL, useValue: { state: tokenState } satisfies CngxStateful<string> },
      ],
    });
    const banner = TestBed.inject(CngxBanner);
    const fixture = TestBed.createComponent(FallbackHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    tokenState.setError(new Error('boom'));
    TestBed.flushEffects();

    expect(banner.banners().length).toBe(1);
  });

  it('logs dev-mode error when neither state input nor CNGX_STATEFUL is available', () => {
    TestBed.configureTestingModule({
      imports: [MissingSourceHost],
      providers: [CngxBanner],
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(MissingSourceHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/No state source/));
    spy.mockRestore();
  });
});
