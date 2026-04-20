import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_TRIGGER_FOCUS_FACTORY,
  createTriggerFocusState,
} from './trigger-focus';

describe('createTriggerFocusState', () => {
  it('starts blurred and exposes a readonly focused signal', () => {
    const state = createTriggerFocusState();
    expect(state.focused()).toBe(false);
  });

  it('markFocused flips the focused signal to true', () => {
    const state = createTriggerFocusState();
    state.markFocused();
    expect(state.focused()).toBe(true);
  });

  it('markBlurred flips the focused signal back to false', () => {
    const state = createTriggerFocusState();
    state.markFocused();
    state.markBlurred();
    expect(state.focused()).toBe(false);
  });

  it('repeated markFocused calls are idempotent', () => {
    const state = createTriggerFocusState();
    state.markFocused();
    state.markFocused();
    state.markFocused();
    expect(state.focused()).toBe(true);
  });
});

describe('CNGX_TRIGGER_FOCUS_FACTORY', () => {
  it('defaults to createTriggerFocusState', () => {
    const factory = TestBed.inject(CNGX_TRIGGER_FOCUS_FACTORY);
    expect(factory).toBe(createTriggerFocusState);
  });

  it('is overridable via the DI token without affecting the built-in default', () => {
    const calls: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_TRIGGER_FOCUS_FACTORY,
          useValue: () => {
            calls.push('custom-factory');
            return createTriggerFocusState();
          },
        },
      ],
    });
    const factory = TestBed.inject(CNGX_TRIGGER_FOCUS_FACTORY);
    const state = factory();
    expect(calls).toEqual(['custom-factory']);
    state.markFocused();
    expect(state.focused()).toBe(true);
  });
});
