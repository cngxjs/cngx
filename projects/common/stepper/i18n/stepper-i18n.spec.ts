import { TestBed } from '@angular/core/testing';
import { computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';

import {
  CNGX_STEPPER_I18N,
  injectStepperI18n,
  provideStepperI18n,
  withStepperI18nLabels,
  type CngxStepperI18nOverrides,
} from './stepper-i18n';

describe('CngxStepperI18n', () => {
  it('derives the pre-section English copy from the English section', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(i18n.stepperLabel).toBe('Stepper');
    expect(i18n.stepIndicatorRoleDescription).toBe('Step indicator');
    expect(i18n.groupRoleDescription).toBe('step group');
    expect(stripBidiIsolates(i18n.selectedStep('Customer', 1, 3))).toBe('Step 1 of 3: Customer');
    expect(stripBidiIsolates(i18n.stepWithDetail('Step 2 of 3: Shipping', 'Errored'))).toBe(
      'Step 2 of 3: Shipping: Errored',
    );
    expect(i18n.stepHasErrors(1)).toBe('1 error');
    expect(i18n.stepHasErrors(2)).toBe('2 errors');
    expect(i18n.previousStep).toBe('Previous step');
    expect(i18n.nextStep).toBe('Next step');
    expect(i18n.commitFailedRetry).toBe('Commit failed - retry?');
    expect(i18n.commitInFlight).toBe('Committing step…');
    expect(stripBidiIsolates(i18n.commitRolledBackTo('Customer'))).toBe(
      'Reverted to step "Customer".',
    );
    expect(stripBidiIsolates(i18n.stepRolledBack('Step 2 of 3: Shipping'))).toBe(
      'Step 2 of 3: Shipping This step was rolled back.',
    );
    expect(i18n.textStepperFormat(2, 5)).toBe('Step 2 of 5');
    expect(i18n.groupSummaryCount(4)).toBe('4 steps');
    expect(i18n.groupSummaryProgress(1, 4)).toBe('1 of 4 steps complete');
    expect(i18n.groupSummaryCountShort(4)).toBe('4');
    expect(i18n.groupSummaryProgressShort(1, 4)).toBe('1/4');
    expect(stripBidiIsolates(i18n.stepFallbackLabel('cdk-step-0'))).toBe('Step cdk-step-0');
  });

  it('fixes the singular group summaries and formats numbers with the locale', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('de')],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(i18n.groupSummaryCount(1)).toBe('1 step');
    expect(i18n.groupSummaryProgress(0, 1)).toBe('0 of 1 step complete');
    expect(i18n.groupSummaryCountShort(1200)).toBe('1.200');
    expect(i18n.textStepperFormat(1, 1200)).toBe('Step 1 of 1.200');
  });

  it('reads the stepper section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const bundle = TestBed.inject(CNGX_STEPPER_I18N);
    expect(bundle().stepperLabel).toBe('Stepper');

    pack.set({
      locale: 'de',
      stepper: {
        stepperLabel: 'Schrittfolge',
        selectedStep: 'Schritt {position} von {count}: {label}',
        groupSummaryCount: { one: '{count} Schritt', other: '{count} Schritte' },
        statusLabels: {
          done: 'Erledigt',
          inProgress: 'Läuft',
          upNext: 'Als Nächstes',
          errored: 'Fehler',
        },
      },
    });
    const german = bundle();
    expect(german.stepperLabel).toBe('Schrittfolge');
    expect(stripBidiIsolates(german.selectedStep('Kunde', 1, 3))).toBe('Schritt 1 von 3: Kunde');
    expect(german.groupSummaryCount(1)).toBe('1 Schritt');
    expect(german.statusLabels.errored).toBe('Fehler');
    expect(german.previousStep).toBe('Previous step');
  });

  it('keeps the bundle while the pack keeps its sections and maps anew on a flip', () => {
    const de = { locale: 'de', stepper: { stepperLabel: 'Schrittfolge' } };
    const pack = signal<CngxActiveLanguagePack | undefined>(de);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const bundle = TestBed.inject(CNGX_STEPPER_I18N);
    const first = bundle();
    pack.set({ ...de });
    expect(bundle()).toBe(first);
    pack.set({ locale: 'de', stepper: { stepperLabel: 'Ablauf' } });
    expect(bundle()).not.toBe(first);
    expect(bundle().stepperLabel).toBe('Ablauf');
  });

  it('lets withStepperI18nLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            stepper: {
              previousStep: 'Zurück',
              statusLabels: {
          done: 'Erledigt',
          inProgress: 'Läuft',
          upNext: 'Als Nächstes',
          errored: 'Fehler',
        },
            },
          }),
          withDocumentLanguage('off'),
        ),
        provideStepperI18n(withStepperI18nLabels({ statusLabels: { done: 'Fertig' } })),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(i18n.previousStep).toBe('Zurück');
    expect(i18n.statusLabels.done).toBe('Fertig');
    expect(i18n.statusLabels.errored).toBe('Fehler');
  });

  it('ships no deprecated stepCompleted / stepErrored keys', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(Object.keys(i18n)).not.toContain('stepCompleted');
    expect(Object.keys(i18n)).not.toContain('stepErrored');
    expect(i18n.statusLabels.done).toBe('Done');
    expect(i18n.statusLabels.errored).toBe('Errored');
  });

  it('withStepperI18nLabels can override commitInFlight + commitRolledBackTo', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({
            commitInFlight: 'Speichere Schritt…',
            commitRolledBackTo: (label) =>
              `Konnte nicht speichern - zurück zu „${label}".`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(i18n.commitInFlight).toBe('Speichere Schritt…');
    expect(i18n.commitRolledBackTo('Kunde')).toBe(
      'Konnte nicht speichern - zurück zu „Kunde".',
    );
    // Defensive fallback unset - keeps its English default.
    expect(i18n.commitFailedRetry).toBe('Commit failed - retry?');
  });

  it('withStepperI18nLabels composes partial overrides on top of defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({
            stepperLabel: 'Schrittfolge',
            selectedStep: (label, position, count) =>
              `Schritt ${position} von ${count}: ${label}`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    expect(i18n.stepperLabel).toBe('Schrittfolge');
    expect(i18n.selectedStep('Kunde', 1, 3)).toBe('Schritt 1 von 3: Kunde');
    // Unset keys keep their English default.
    expect(i18n.previousStep).toBe('Previous step');
  });

  it('multiple withStepperI18nLabels features compose left-to-right', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({ stepperLabel: 'A' }),
          withStepperI18nLabels({ stepperLabel: 'B', previousStep: 'Vor' }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
    // Second feature wins on overlapping keys.
    expect(i18n.stepperLabel).toBe('B');
    expect(i18n.previousStep).toBe('Vor');
  });

  it('withStepperI18nLabels carries the _target=i18n discriminator', () => {
    // Branding axis - guards against accidental loss of the
    // `_target` brand, which would let provideCngxStepper silently
    // drop the feature in dev-mode.
    expect(withStepperI18nLabels({ stepperLabel: 'X' })._target).toBe('i18n');
  });

  it('injectStepperI18n works inside an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.runInInjectionContext(() => {
      const i18n = injectStepperI18n()();
      expect(i18n.stepperLabel).toBe('Stepper');
    });
  });

  describe('statusLabels (stripe-status-rich skin)', () => {
    it('library default ships English status labels', () => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection()],
      });
      const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
      expect(i18n.statusLabels.done).toBe('Done');
      expect(i18n.statusLabels.inProgress).toBe('In progress');
      expect(i18n.statusLabels.upNext).toBe('Up next');
      expect(i18n.statusLabels.errored).toBe('Errored');
    });

    it('partial override merges per key - unset pills keep their English default', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(
            withStepperI18nLabels({
              statusLabels: { done: 'Erledigt', errored: 'Fehler' },
            }),
          ),
        ],
      });
      const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
      expect(i18n.statusLabels.done).toBe('Erledigt');
      expect(i18n.statusLabels.errored).toBe('Fehler');
      // Unset keys keep their English default.
      expect(i18n.statusLabels.inProgress).toBe('In progress');
      expect(i18n.statusLabels.upNext).toBe('Up next');
    });

    it('multiple withStepperI18nLabels features merge statusLabels left-to-right', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(
            withStepperI18nLabels({ statusLabels: { done: 'A', errored: 'X' } }),
            withStepperI18nLabels({ statusLabels: { done: 'B', upNext: 'C' } }),
          ),
        ],
      });
      const i18n = TestBed.inject(CNGX_STEPPER_I18N)();
      // Second feature wins on overlapping keys.
      expect(i18n.statusLabels.done).toBe('B');
      // Earlier features survive when later features don't touch the key.
      expect(i18n.statusLabels.errored).toBe('X');
      // Later feature's new keys land on top.
      expect(i18n.statusLabels.upNext).toBe('C');
      // Un-overridden keys keep the English default.
      expect(i18n.statusLabels.inProgress).toBe('In progress');
    });
  });

  describe('runtime language switch', () => {
    it('a Signal override flips every label without a re-inject', () => {
      const lang = signal<'en' | 'de'>('en');
      const overrides = (): CngxStepperI18nOverrides =>
        lang() === 'de' ? { stepperLabel: 'Schrittfolge', statusLabels: { done: 'Erledigt' } } : {};
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(withStepperI18nLabels(computed(overrides))),
        ],
      });
      const i18n = TestBed.inject(CNGX_STEPPER_I18N);
      expect(i18n().stepperLabel).toBe('Stepper');
      expect(i18n().statusLabels.done).toBe('Done');

      lang.set('de');
      expect(i18n().stepperLabel).toBe('Schrittfolge');
      expect(i18n().statusLabels.done).toBe('Erledigt');
      expect(i18n().statusLabels.errored).toBe('Errored');
    });

    it('injects one Signal per injector', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(withStepperI18nLabels({ stepperLabel: 'A' })),
        ],
      });
      const first = TestBed.inject(CNGX_STEPPER_I18N);
      const second = TestBed.runInInjectionContext(() => injectStepperI18n());
      expect(second).toBe(first);
    });

    it('keeps the bundle reference when an override is re-set to an equal object', () => {
      const overrides = signal<CngxStepperI18nOverrides>({ statusLabels: { done: 'Erledigt' } });
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(withStepperI18nLabels(overrides)),
        ],
      });
      const i18n = TestBed.inject(CNGX_STEPPER_I18N);
      const before = i18n();
      overrides.set({ statusLabels: { done: 'Erledigt' } });
      expect(i18n()).toBe(before);
    });

    it('resolves static overrides to the same bundle as the eager merge', () => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
      const defaults = TestBed.inject(CNGX_STEPPER_I18N)();
      TestBed.resetTestingModule();

      const first: CngxStepperI18nOverrides = {
        stepperLabel: 'Schrittfolge',
        statusLabels: { done: 'Erledigt', errored: 'Fehler' },
      };
      const second: CngxStepperI18nOverrides = { previousStep: 'Vor', statusLabels: { done: 'Fertig' } };
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(withStepperI18nLabels(first), withStepperI18nLabels(second)),
        ],
      });
      const merged = TestBed.inject(CNGX_STEPPER_I18N)();
      expect(merged.stepperLabel).toBe('Schrittfolge');
      expect(merged.previousStep).toBe('Vor');
      expect(merged.nextStep).toBe(defaults.nextStep);
      expect(merged.statusLabels).toEqual({
        ...defaults.statusLabels,
        ...first.statusLabels,
        ...second.statusLabels,
      });
    });

    it('an override without statusLabels keeps every default pill label', () => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideStepperI18n(withStepperI18nLabels({ stepperLabel: 'Schrittfolge' })),
        ],
      });
      expect(TestBed.inject(CNGX_STEPPER_I18N)().statusLabels).toEqual({
        done: 'Done',
        inProgress: 'In progress',
        upNext: 'Up next',
        errored: 'Errored',
      });
    });
  });
});
