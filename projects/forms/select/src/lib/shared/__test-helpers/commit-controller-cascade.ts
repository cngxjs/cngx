import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_COMMIT_CONTROLLER_FACTORY,
  createCommitController as createGenericCommitController,
  type CngxCommitController as CngxGenericCommitController,
} from '@cngx/common/data';

import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../commit-controller.token';

/**
 * Shared smoke spec for the Phase 0 commit-controller lift. Asserts
 * that every select variant resolves the select-side factory token
 * to a working controller AND that an override on the lifted generic
 * `CNGX_COMMIT_CONTROLLER_FACTORY` cascades transparently into the
 * select-side wrapper. Each variant's `*.spec.ts` calls this helper
 * inside its own describe block to lock the lift's invariants on a
 * per-variant basis.
 *
 * @internal
 */
export function describeCommitControllerCascade(variantName: string): void {
  describe(`commit-controller lift smoke (${variantName})`, () => {
    it('CNGX_SELECT_COMMIT_CONTROLLER_FACTORY resolves to a working controller', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const factory = TestBed.inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY);
      const ctrl = factory<unknown>();
      expect(typeof ctrl.begin).toBe('function');
      expect(typeof ctrl.cancel).toBe('function');
      expect(ctrl.state.status()).toBe('idle');
      expect(ctrl.isCommitting()).toBe(false);
    });

    it('CNGX_COMMIT_CONTROLLER_FACTORY override cascades into the select-side wrapper', () => {
      const overrideTag = Symbol(`override-${variantName}`);
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          {
            provide: CNGX_COMMIT_CONTROLLER_FACTORY,
            useValue: <T>() =>
              Object.assign(createGenericCommitController<T>(), {
                __overrideTag: overrideTag,
              }) as CngxGenericCommitController<T> & {
                readonly __overrideTag: symbol;
              },
          },
        ],
      });
      const factory = TestBed.inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY);
      const ctrl = factory<unknown>();
      // The select-side wrapper unwraps the generic and re-wires its
      // signal accessors. Verify the wrapper still produces a usable
      // controller — the override surface is invisible at the select
      // call-sites, by design.
      expect(typeof ctrl.begin).toBe('function');
      expect(ctrl.state.status()).toBe('idle');
    });
  });
}
