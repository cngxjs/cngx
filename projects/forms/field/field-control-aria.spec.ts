import { signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { createFieldControlAria } from './field-control-aria';
import type { CngxFormFieldPresenter } from './form-field-presenter';

function makePresenter() {
  const state = {
    inputId: signal('field-input-1'),
    disabled: signal(false),
    showError: signal(false),
    describedBy: signal('hint-1'),
    labelId: signal('label-1'),
    required: signal(false),
    pending: signal(false),
    readonly: signal(false),
    errorId: signal('error-1'),
    touched: 0,
  };
  const presenter = {
    inputId: state.inputId,
    disabled: state.disabled,
    showError: state.showError,
    describedBy: state.describedBy,
    labelId: state.labelId,
    required: state.required,
    pending: state.pending,
    readonly: state.readonly,
    errorId: state.errorId,
    fieldState: () => ({
      markAsTouched: () => {
        state.touched += 1;
      },
    }),
  } as unknown as CngxFormFieldPresenter;
  return { presenter, state };
}

describe('createFieldControlAria', () => {
  describe('without a presenter', () => {
    it('falls back to inert defaults', () => {
      const aria = createFieldControlAria(null);
      expect(aria.id()).toBe('');
      expect(aria.disabled()).toBe(false);
      expect(aria.errorState()).toBe(false);
      expect(aria.describedBy()).toBeNull();
      expect(aria.labelledBy()).toBeNull();
      expect(aria.ariaInvalid()).toBeNull();
      expect(aria.ariaRequired()).toBeNull();
      expect(aria.ariaBusy()).toBeNull();
      expect(aria.ariaErrorMessage()).toBeNull();
      expect(aria.ariaReadonly()).toBeNull();
      expect(aria.ariaDisabled()).toBeNull();
    });

    it('uses the configured fallback id', () => {
      const aria = createFieldControlAria(null, { fallbackId: 'my-rating-3' });
      expect(aria.id()).toBe('my-rating-3');
    });
  });

  describe('with a presenter', () => {
    let h: ReturnType<typeof makePresenter>;
    let aria: ReturnType<typeof createFieldControlAria>;

    beforeEach(() => {
      h = makePresenter();
      aria = createFieldControlAria(h.presenter);
    });

    it('projects id, labelledBy and describedBy from the field', () => {
      expect(aria.id()).toBe('field-input-1');
      expect(aria.labelledBy()).toBe('label-1');
      expect(aria.describedBy()).toBe('hint-1');
    });

    it('derives errorState, aria-invalid and the gated aria-errormessage together', () => {
      expect(aria.errorState()).toBe(false);
      expect(aria.ariaErrorMessage()).toBeNull();
      h.state.showError.set(true);
      expect(aria.errorState()).toBe(true);
      expect(aria.ariaInvalid()).toBe(true);
      expect(aria.ariaErrorMessage()).toBe('error-1');
    });

    it('maps required/pending/readonly onto true-or-null attribute shapes', () => {
      h.state.required.set(true);
      h.state.pending.set(true);
      h.state.readonly.set(true);
      expect(aria.ariaRequired()).toBe(true);
      expect(aria.ariaBusy()).toBe(true);
      expect(aria.ariaReadonly()).toBe(true);
    });

    it('tracks field disabled and reflects it as aria-disabled', () => {
      h.state.disabled.set(true);
      expect(aria.disabled()).toBe(true);
      expect(aria.ariaDisabled()).toBe(true);
    });
  });

  describe('localDisabled', () => {
    it("OR's the control knob with the field state", () => {
      const h = makePresenter();
      const local = signal(false);
      const aria = createFieldControlAria(h.presenter, { localDisabled: local });
      expect(aria.disabled()).toBe(false);
      local.set(true);
      expect(aria.disabled()).toBe(true);
      local.set(false);
      h.state.disabled.set(true);
      expect(aria.disabled()).toBe(true);
    });
  });

  describe('disabled-reason describedBy gating', () => {
    it('appends the reason id only while disabled with a reason', () => {
      const h = makePresenter();
      const local = signal(false);
      const reason = signal('');
      const aria = createFieldControlAria(h.presenter, {
        localDisabled: local,
        disabledReason: { id: 'reason-1', reason },
      });
      expect(aria.describedBy()).toBe('hint-1');
      reason.set('Locked by admin');
      // Reason set while enabled must NOT announce (accname traverses
      // directly-referenced hidden nodes).
      expect(aria.describedBy()).toBe('hint-1');
      local.set(true);
      expect(aria.describedBy()).toBe('hint-1 reason-1');
      reason.set('');
      expect(aria.describedBy()).toBe('hint-1');
    });

    it('emits the reason id alone without a presenter', () => {
      const local = signal(true);
      const aria = createFieldControlAria(null, {
        localDisabled: local,
        disabledReason: { id: 'reason-1', reason: () => 'Locked' },
      });
      expect(aria.describedBy()).toBe('reason-1');
    });
  });

  describe('focus handlers', () => {
    it('handleFocusIn/handleFocusOut toggle focused and touch the field on blur', () => {
      const h = makePresenter();
      const aria = createFieldControlAria(h.presenter);
      expect(aria.focused()).toBe(false);
      aria.handleFocusIn();
      expect(aria.focused()).toBe(true);
      aria.handleFocusOut();
      expect(aria.focused()).toBe(false);
      expect(h.state.touched).toBe(1);
    });

    it('handleFocusOutWithin keeps focus for moves inside the host and never touches the field', () => {
      const h = makePresenter();
      const aria = createFieldControlAria(h.presenter);
      const host = document.createElement('div');
      const inner = document.createElement('button');
      host.appendChild(inner);
      aria.handleFocusIn();

      aria.handleFocusOutWithin({ relatedTarget: inner } as unknown as FocusEvent, host);
      expect(aria.focused()).toBe(true);

      aria.handleFocusOutWithin({ relatedTarget: null } as unknown as FocusEvent, host);
      expect(aria.focused()).toBe(false);
      expect(h.state.touched).toBe(0);
    });
  });
});
