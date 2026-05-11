import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_ACTION_SELECT_CONFIG,
  withFocusTrapBehavior,
  withCloseOnCreate,
} from './action-select-config';
import {
  CNGX_SELECT_CONFIG,
  withAriaLabels,
  withPanelWidth,
  withVirtualization,
} from './config';
import {
  provideCngxSelect,
  provideCngxSelectAt,
} from './provide-cngx-select';
import {
  CNGX_REORDERABLE_SELECT_CONFIG,
  withReorderKeyboardModifier,
} from './reorderable-select-config';

describe('provideCngxSelect (app-wide aggregator)', () => {
  it('dispatches CngxSelectConfig features to CNGX_SELECT_CONFIG', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxSelect(
          withPanelWidth(480),
          withAriaLabels({ clearButton: 'Wipe' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_SELECT_CONFIG);
    expect(cfg.panelWidth).toBe(480);
    expect(cfg.ariaLabels?.clearButton).toBe('Wipe');
  });

  it('dispatches CngxActionSelectConfig features to CNGX_ACTION_SELECT_CONFIG', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxSelect(
          withFocusTrapBehavior('always'),
          withCloseOnCreate(false),
        ),
      ],
    });
    const action = TestBed.inject(CNGX_ACTION_SELECT_CONFIG);
    expect(action.focusTrapBehavior).toBe('always');
    expect(action.closeOnCreate).toBe(false);
  });

  it('dispatches CngxReorderableSelectConfig features to CNGX_REORDERABLE_SELECT_CONFIG', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxSelect(withReorderKeyboardModifier('alt')),
      ],
    });
    const reorderable = TestBed.inject(CNGX_REORDERABLE_SELECT_CONFIG);
    expect(reorderable.keyboardModifier).toBe('alt');
  });

  it('mixes features from all three surfaces in a single call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxSelect(
          withPanelWidth(640),
          withVirtualization({ estimateSize: 36 }),
          withFocusTrapBehavior('never'),
          withReorderKeyboardModifier('meta'),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_SELECT_CONFIG).panelWidth).toBe(640);
    expect(TestBed.inject(CNGX_SELECT_CONFIG).virtualization).toEqual({
      estimateSize: 36,
    });
    expect(TestBed.inject(CNGX_ACTION_SELECT_CONFIG).focusTrapBehavior).toBe(
      'never',
    );
    expect(TestBed.inject(CNGX_REORDERABLE_SELECT_CONFIG).keyboardModifier).toBe(
      'meta',
    );
  });

  it('omits unused providers when no features for a surface are supplied', () => {
    TestBed.configureTestingModule({
      providers: [provideCngxSelect(withPanelWidth(320))],
    });
    // Only CNGX_SELECT_CONFIG is registered. The action + reorderable
    // tokens are NOT provided — consumers using `resolveActionSelectConfig`
    // / `resolveReorderableSelectConfig` get the library defaults via
    // `inject(token, { optional: true })` ?? defaults.
    expect(TestBed.inject(CNGX_SELECT_CONFIG).panelWidth).toBe(320);
    expect(TestBed.inject(CNGX_ACTION_SELECT_CONFIG, null)).toBeNull();
    expect(TestBed.inject(CNGX_REORDERABLE_SELECT_CONFIG, null)).toBeNull();
  });
});

describe('provideCngxSelectAt (component-scoped aggregator)', () => {
  it('dispatches mixed features into a flat Provider[]', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideCngxSelectAt(
          withPanelWidth(720),
          withFocusTrapBehavior('always'),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_SELECT_CONFIG).panelWidth).toBe(720);
    expect(TestBed.inject(CNGX_ACTION_SELECT_CONFIG).focusTrapBehavior).toBe(
      'always',
    );
  });
});
