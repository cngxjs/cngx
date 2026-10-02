import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';
import { describe, expect, it } from 'vitest';

import { createStepperGroupSummary } from './group-summary';
import { CNGX_STEPPER_I18N } from './i18n/stepper-i18n';
import type { CngxStepNode, CngxStepStatus } from './stepper-host.token';

function step(state: CngxStepStatus): CngxStepNode {
  return { kind: 'step', state: () => state, children: [] } as unknown as CngxStepNode;
}

function group(steps: number, done: number): CngxStepNode {
  const children = Array.from({ length: steps }, (_, i) => step(i < done ? 'success' : 'idle'));
  return { kind: 'group', state: () => 'idle', children } as unknown as CngxStepNode;
}

function summary(mode: 'count' | 'progress') {
  return createStepperGroupSummary({
    summaryMode: () => mode,
    isCollapsed: () => true,
    i18n: TestBed.inject(CNGX_STEPPER_I18N),
  });
}

describe('createStepperGroupSummary', () => {
  it('renders the visible badge through the short messages, numbers in the locale', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack({ locale: 'de' }), withDocumentLanguage('off')),
      ],
    });
    expect(summary('count').text(group(1200, 0))).toBe('1.200');
    expect(summary('progress').text(group(4, 1))).toBe('1/4');
  });

  it('lets a pack reorder the visible progress badge', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'en',
            stepper: { groupSummaryProgressShort: '{count}:{completed}' },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    expect(summary('progress').text(group(4, 1))).toBe('4:1');
  });

  it('reads the screen-reader phrase with a singular form', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    expect(summary('count').srText(group(1, 0))).toBe('1 step');
  });
});
