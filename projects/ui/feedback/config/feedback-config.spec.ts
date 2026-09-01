import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_FEEDBACK_CONFIG,
  provideFeedback,
  withAlerts,
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
      withToasts({ defaultDuration: 4000, dedupWindow: 500 }),
      withToasts(),
    );
    expect(config.toastDefaultDuration).toBe(4000);
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
