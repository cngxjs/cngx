import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_BUTTON_CLOSE_ICON, injectButtonCloseIcon } from '@cngx/common/button';
import {
  CNGX_LOADING_DEFAULTS,
  injectLoadingConfig,
  provideLoadingConfig,
  withSpinnerVsSkeletonCutoff,
} from '@cngx/core/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_FEEDBACK_CONFIG,
  injectErrorDetail,
  provideFeedback,
  withAlerts,
  withCloseIcon,
  withToasts,
  type FeedbackFeature,
} from './feedback-config';

function resolveConfig(...features: FeedbackFeature[]) {
  TestBed.configureTestingModule({ providers: [provideFeedback(...features)] });
  return TestBed.inject(CNGX_FEEDBACK_CONFIG);
}

describe('provideFeedback merge rule', () => {
  it('withToasts() without options preserves values from earlier features', () => {
    const config = resolveConfig(
      withToasts({ defaultDuration: 4000, actionDuration: 8000, dedupWindow: 500 }),
      withToasts(),
    );
    expect(config.toastDefaultDuration).toBe(4000);
    expect(config.toastActionDuration).toBe(8000);
    expect(config.toastDedupWindow).toBe(500);
  });

  it('withAlerts() without options preserves values from earlier features', () => {
    const config = resolveConfig(
      withAlerts({ defaultDuration: 3000, dedupWindow: 500, maxVisible: 2 }),
      withAlerts(),
    );
    expect(config.alertDefaultDuration).toBe(3000);
    expect(config.alertDedupWindow).toBe(500);
    expect(config.alertMaxVisible).toBe(2);
  });

  it('an explicitly passed option wins over an earlier value', () => {
    const config = resolveConfig(
      withToasts({ defaultDuration: 4000 }),
      withToasts({ defaultDuration: 6000 }),
    );
    expect(config.toastDefaultDuration).toBe(6000);
  });

  it('partial options only touch their own fields', () => {
    const config = resolveConfig(
      withAlerts({ defaultDuration: 3000, maxVisible: 2 }),
      withAlerts({ dedupWindow: 250 }),
    );
    expect(config.alertDefaultDuration).toBe(3000);
    expect(config.alertDedupWindow).toBe(250);
    expect(config.alertMaxVisible).toBe(2);
  });
});

@Component({ selector: 'test-close-glyph', template: 'x' })
class CloseGlyph {}

describe('withCloseIcon', () => {
  it('provides the glyph through provideButtonCloseIcon and records it on the config', () => {
    const config = resolveConfig(withCloseIcon(CloseGlyph));
    expect(config.closeIconComponent).toBe(CloseGlyph);
    expect(TestBed.inject(CNGX_BUTTON_CLOSE_ICON)).toBe(CloseGlyph);
    expect(TestBed.runInInjectionContext(() => injectButtonCloseIcon())).toBe(CloseGlyph);
  });
});

describe('loading timing', () => {
  it('provideFeedback leaves the loading config at its defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideFeedback(withToasts(), withAlerts(), withCloseIcon(CloseGlyph))],
    });
    expect(TestBed.runInInjectionContext(() => injectLoadingConfig())).toEqual(
      CNGX_LOADING_DEFAULTS,
    );
  });

  it('provideFeedback registered after provideLoadingConfig keeps the app timing', () => {
    // provideFeedback goes last so a loading provider of its own would win under DI last-wins.
    TestBed.configureTestingModule({
      providers: [
        provideLoadingConfig(withSpinnerVsSkeletonCutoff(1200)),
        provideFeedback(withToasts(), withAlerts(), withCloseIcon(CloseGlyph)),
      ],
    });
    expect(TestBed.runInInjectionContext(() => injectLoadingConfig())).toEqual({
      ...CNGX_LOADING_DEFAULTS,
      spinnerVsSkeletonCutoff: 1200,
    });
  });
});

describe('injectErrorDetail default', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const detailFor = (error: unknown) =>
    TestBed.runInInjectionContext(() => injectErrorDetail())(error);

  it('shows no detail and writes nothing in production', () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(detailFor(new Error('boom'))).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('shows the raw text and warns once with CNGX3004 in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(detailFor(new Error('boom'))).toBe('boom');
    expect(detailFor(new Error('boom'))).toBe('boom');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(
      /^CNGX3004: injectErrorDetail\(\): showing the raw/,
    );
  });
});
