/**
 * Manifests for `reactive-i18n-coverage.test.mjs`.
 *
 * Kept beside the guard for the same reason as the string-coverage manifests:
 * the classification, the ratchet and the live-region manifest are the
 * auditable artefact of the reactive-i18n program and change on a different
 * cadence than the scanner.
 *
 * Rows are keyed by `file` + `member` + `rule` + `token`, never by line. A
 * `member` is `Class.member` inside a class (`Class.constructor`,
 * `Class.template:<root>` for a template read), else the top-level
 * declaration.
 */

/**
 * A copy token: its strings reach users or assistive technology. `copyKeys`
 * is `'*'` for a dedicated i18n token (the whole value is copy); for a config
 * token, `copyKeys` and `settingsKeys` partition the interface keys exactly.
 * `closesIn` is the phase that makes the token follow a live flip.
 *
 * @typedef {object} CopyTokenEntry
 * @property {string} token
 * @property {'dedicated' | 'config' | 'locale'} kind
 * @property {'*' | readonly string[]} copyKeys
 * @property {readonly string[]} settingsKeys
 * @property {number} closesIn
 * @property {string} [note]
 */

/**
 * One finding the guard knows about.
 *
 * @typedef {object} RatchetRow
 * @property {string} file
 * @property {string} member
 * @property {'R1' | 'R2' | 'R3' | 'R4'} rule
 * @property {string} token
 * @property {number} closesIn
 */

/**
 * A permanent exception. `debtRef` names the accepted-debt entry that settled
 * it, as `<register>.md#<entry heading>`.
 *
 * @typedef {object} ExemptRow
 * @property {string} file
 * @property {string} member
 * @property {'R1' | 'R2' | 'R3' | 'R4'} rule
 * @property {string} token
 * @property {string} reason
 * @property {string} debtRef
 */

/**
 * A live region that renders copy. `spec` + `testName` name the no-respeak
 * test, enforced from `COMPLETED_PHASE >= closesIn`. A region that only ever
 * renders consumer text is `kind: 'consumer-text'` with a `reason`.
 *
 * @typedef {object} LiveRegionEntry
 * @property {string} file
 * @property {string} region
 * @property {string} [spec]
 * @property {string} [testName]
 * @property {number} [closesIn]
 * @property {'consumer-text'} [kind]
 * @property {string} [reason]
 */

/** @type {readonly CopyTokenEntry[]} */
export const COPY_TOKENS = [];

/** @type {readonly string[]} */
export const SETTINGS_TOKENS = [];

/**
 * Functions whose body may dereference raw copy: the resolver choke points a
 * reader goes through.
 *
 * @type {readonly string[]}
 */
export const HELPERS = [];

/** @type {readonly RatchetRow[]} */
export const RATCHET = [];

export const RATCHET_CEILING = 0;

/** The last phase whose closing commit has landed. */
export const COMPLETED_PHASE = 0;

/**
 * The sorted row keys of `RATCHET` at the end of Phase 1; no row may join the
 * ratchet after that, not even in exchange for a fixed one.
 *
 * @type {readonly string[]}
 */
export const PHASE_1_KEYS = [];

/** @type {readonly ExemptRow[]} */
export const EXEMPT = [];

/** @type {readonly LiveRegionEntry[]} */
export const LIVE_REGIONS = [];

// ---------------------------------------------------------------------------
// Rule fixtures: one in-memory program, a negative and a passing file per
// rule. The prescribed shapes from the plan are the passing files.

const TOKENS = `
import { InjectionToken, inject, signal, type Signal } from '@angular/core';

export interface DemoI18n {
  readonly previous: string;
  readonly count: (n: number) => string;
}

export interface DemoSignalI18n {
  readonly previous: string;
  readonly count: (n: number) => string;
}

export interface DemoLabels {
  readonly clear: string;
  readonly more: string;
}

export interface DemoConfig {
  readonly ariaLabels: DemoLabels;
  readonly title: string;
  readonly delay: number;
}

export const DEMO_DEFAULTS: DemoConfig = {
  ariaLabels: { clear: 'Clear', more: 'More' },
  title: 'Title',
  delay: 0,
};

const DEMO_I18N_DEFAULTS: DemoI18n = { previous: 'Previous', count: (n) => n + ' items' };

export const DEMO_I18N = new InjectionToken<DemoI18n>('DemoI18n', {
  providedIn: 'root',
  factory: () => DEMO_I18N_DEFAULTS,
});

export const DEMO_SIGNAL_I18N = new InjectionToken<Signal<DemoSignalI18n>>('DemoSignalI18n', {
  providedIn: 'root',
  factory: () => signal<DemoSignalI18n>(DEMO_I18N_DEFAULTS).asReadonly(),
});

export const DEMO_CONFIG = new InjectionToken<DemoConfig>('DemoConfig', {
  providedIn: 'root',
  factory: () => DEMO_DEFAULTS,
});

export const DEMO_LOCALE = new InjectionToken<Signal<string>>('DemoLocale', {
  providedIn: 'root',
  factory: () => signal('en').asReadonly(),
});

export const DEMO_DELAY = new InjectionToken<number>('DemoDelay');

export function injectLocale(): Signal<string> {
  return inject(DEMO_LOCALE);
}

export function injectDemoPrevious(): string {
  return inject(DEMO_I18N).previous;
}
`;

const HELPER_FUNCTIONS = `
import { computed, isSignal, signal, type Signal } from '@angular/core';

export function coerceSignal<T>(source: T | Signal<T>): Signal<T> {
  return isSignal(source) ? source : signal(source).asReadonly();
}

export function createOverrideMerge<T extends object>(
  defaults: T | Signal<T>,
  overrides: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  const d = coerceSignal(defaults);
  const o = coerceSignal<Partial<T>>(overrides ?? {});
  return computed(() => ({ ...d(), ...o() }));
}
`;

const R1 = `
import { Directive, computed, inject, input } from '@angular/core';
import { DEMO_CONFIG, DEMO_SIGNAL_I18N, injectLocale } from './tokens';

@Directive({ selector: '[r1]' })
export class R1Static {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly fallback = computed(() => this.i18n().previous);
  readonly previousLabel = input(this.i18n().previous);
  readonly title = input(this.cfg.title ?? 'Title');
  readonly localeInput = input(injectLocale()());
  readonly fromCarrier = input(this.fallback());
}
`;

const R1_PASS = `
import { Directive, computed, inject, input } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

@Directive({ selector: '[r1Pass]' })
export class R1Reactive {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  readonly previousLabel = input<string | undefined>(undefined);
  protected readonly resolvedPrevious = computed(
    () => this.previousLabel() ?? this.i18n().previous,
  );
}
`;

const R2 = `
import { Directive, InjectionToken, inject } from '@angular/core';
import { DEMO_SIGNAL_I18N, injectLocale } from './tokens';

@Directive({ selector: '[r2]' })
export class R2Snapshot {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly snapshot = this.i18n().previous;
  protected readonly lang: string;

  constructor() {
    this.lang = injectLocale()();
  }
}

export const DEMO_FORMAT = new InjectionToken<Intl.NumberFormat>('DemoFormat', {
  providedIn: 'root',
  factory: () => new Intl.NumberFormat(injectLocale()()),
});
`;

const R2_PASS = `
import { Directive, computed, inject } from '@angular/core';
import { coerceSignal, createOverrideMerge } from './helpers';
import { DEMO_CONFIG, DEMO_DEFAULTS, injectLocale } from './tokens';

@Directive({ selector: '[r2Pass]' })
export class R2Lazy {
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly labels = createOverrideMerge(DEMO_DEFAULTS.ariaLabels, this.cfg.ariaLabels);
  protected readonly title = coerceSignal(this.cfg.title ?? DEMO_DEFAULTS.title);
  protected readonly locale = injectLocale();
  protected readonly clearLabel = computed(() => this.labels().clear);
  protected readonly lang = computed(() => this.locale());
}
`;

const R3 = `
import { Component, Directive, computed, inject } from '@angular/core';
import { DEMO_CONFIG, DEMO_I18N, type DemoConfig, type DemoLabels } from './tokens';

@Directive({ selector: '[r3]' })
export class R3Raw {
  protected readonly raw = inject(DEMO_I18N);
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly previous = computed(() => this.raw.previous);
  protected readonly clear = computed(() => this.cfg.ariaLabels.clear);
}

@Component({ selector: 'r3-template', template: '<span>{{ raw.previous }}</span>' })
export class R3Template {
  protected readonly raw = inject(DEMO_I18N);
}

export function withDemoLabels(labels: Partial<DemoLabels>) {
  return (base: DemoConfig): DemoConfig => ({
    ...base,
    ariaLabels: { ...base.ariaLabels, ...labels },
  });
}

export function describeOptions(options: { readonly config: DemoConfig }): string {
  return options.config.ariaLabels.more;
}
`;

const R3_PASS = `
import { Directive, computed, inject } from '@angular/core';
import { DEMO_DEFAULTS, DEMO_SIGNAL_I18N, type DemoLabels } from './tokens';

export function clearText(labels: DemoLabels): string {
  return labels.clear;
}

@Directive({ selector: '[r3Pass]' })
export class R3Signal {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly previous = computed(() => this.i18n().previous);
  protected readonly defaultsClear = DEMO_DEFAULTS.ariaLabels.clear;
}
`;

const R4 = `
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

class Announcer {
  announce(message: string): string {
    return message;
  }
}

@Component({
  selector: 'r4-tracked',
  template: '<span>{{ title() }}</span><p aria-live="polite">{{ message() }}</p>',
  host: { role: 'status', '[attr.aria-label]': 'label()' },
})
export class R4Tracked {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly announcer = new Announcer();
  readonly count = input(0);
  protected readonly label = computed(() => this.i18n().count(this.count()));
  protected readonly title = signal('Board');
  protected readonly message = computed(() => this.i18n().previous);

  constructor() {
    effect(() => {
      this.announcer.announce(this.i18n().previous);
    });
  }
}
`;

const R4_PASS = `
import { Component, computed, inject, input, untracked } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

@Component({
  selector: 'r4-untracked',
  template: \`
    <p aria-live="polite">{{ announcement() }}</p>
    <span>{{ label() }}</span>
    <span role="status">{{ spoken() }}</span>
  \`,
  host: { '[attr.aria-label]': 'label()' },
})
export class R4Untracked {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  readonly status = input<'idle' | 'done'>('idle');
  readonly text = input<string | undefined>(undefined);
  protected readonly label = computed(() => this.i18n().previous);
  protected readonly announcement = computed(() => {
    const status = this.status();
    return untracked(() => (status === 'done' ? this.i18n().previous : ''));
  });
  protected readonly resolvedText = computed(() => this.text() ?? this.i18n().previous);
  protected readonly spoken = computed(() => {
    const status = this.status();
    return untracked(() => (status === 'done' ? this.resolvedText() : ''));
  });
}
`;

/**
 * In-memory sources, the copy model they run against, and the rows each file
 * must produce (`member rule token`).
 */
export const RULE_FIXTURES = {
  sources: {
    'tokens.ts': TOKENS,
    'helpers.ts': HELPER_FUNCTIONS,
    'r1.ts': R1,
    'r1-pass.ts': R1_PASS,
    'r2.ts': R2,
    'r2-pass.ts': R2_PASS,
    'r3.ts': R3,
    'r3-pass.ts': R3_PASS,
    'r4.ts': R4,
    'r4-pass.ts': R4_PASS,
  },
  /** @type {readonly CopyTokenEntry[]} */
  copyTokens: [
    { token: 'DEMO_I18N', kind: 'dedicated', copyKeys: '*', settingsKeys: [], closesIn: 2 },
    { token: 'DEMO_SIGNAL_I18N', kind: 'dedicated', copyKeys: '*', settingsKeys: [], closesIn: 2 },
    {
      token: 'DEMO_CONFIG',
      kind: 'config',
      copyKeys: ['ariaLabels', 'title'],
      settingsKeys: ['delay'],
      closesIn: 2,
    },
    { token: 'DEMO_LOCALE', kind: 'locale', copyKeys: '*', settingsKeys: [], closesIn: 2 },
  ],
  settingsTokens: ['DEMO_DELAY', 'DEMO_FORMAT'],
  helpers: ['injectDemoPrevious'],
  expected: {
    'tokens.ts': [],
    'helpers.ts': [],
    'r1.ts': [
      'R1Static.previousLabel R1 DEMO_SIGNAL_I18N',
      'R1Static.title R1 DEMO_CONFIG',
      'R1Static.localeInput R1 DEMO_LOCALE',
      'R1Static.fromCarrier R1 DEMO_SIGNAL_I18N',
    ],
    'r1-pass.ts': [],
    'r2.ts': [
      'R2Snapshot.snapshot R2 DEMO_SIGNAL_I18N',
      'R2Snapshot.constructor R2 DEMO_LOCALE',
      'DEMO_FORMAT R2 DEMO_LOCALE',
    ],
    'r2-pass.ts': [],
    'r3.ts': [
      'R3Raw.previous R3 DEMO_I18N',
      'R3Raw.clear R3 DEMO_CONFIG',
      'R3Template.template:raw R3 DEMO_I18N',
      'withDemoLabels R3 DEMO_CONFIG',
      'describeOptions R3 DEMO_CONFIG',
    ],
    'r3-pass.ts': [],
    'r4.ts': [
      'R4Tracked.label R4 DEMO_SIGNAL_I18N',
      'R4Tracked.message R4 DEMO_SIGNAL_I18N',
      'R4Tracked.constructor R4 DEMO_SIGNAL_I18N',
    ],
    'r4-pass.ts': [],
  },
  expectedRegions: [
    'r4.ts R4Tracked.host',
    'r4.ts R4Tracked.p#1',
    'r4.ts R4Tracked.constructor:effect#1',
    'r4-pass.ts R4Untracked.p#1',
    'r4-pass.ts R4Untracked.span#1',
  ],
};
