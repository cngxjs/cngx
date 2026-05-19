/**
 * Typed contract for `*.story.ts` files.
 *
 * Story files are pure TypeScript data — no Angular imports, no runtime deps.
 * They are consumed by `scripts/generate-examples.mjs` to produce one naked
 * example component under `examples/src/app/features/**` per story, plus the
 * routes + metadata files the home directory listing reads from.
 *
 * One story = one example. Navigation is derived from the filesystem path:
 * `examples/stories/<lib>/<category>/<demo>/<slug>.story.ts` becomes
 * `examples/src/app/features/<lib>/<category>/<demo>/<slug>.component.ts`
 * and routes to `/<lib>/<category>/<demo>/<slug>`.
 */

/** Composition density of the underlying symbol. Toolkit-agnostic. */
export type AtomicLevel = 'atom' | 'molecule' | 'organism';

/** Reader audience the demo serves. */
export type Audience = 'dev' | 'design' | 'a11y';

/** Whether the demo's subject drops in (`standalone`) or needs wiring (`building-block`). */
export type Artifact = 'standalone' | 'building-block';

/** What aspect of the symbol a demo illustrates. */
export type Focus =
  | 'visual-variants'
  | 'behavior'
  | 'a11y-pattern'
  | 'integration'
  | 'error-handling'
  | 'async-state'
  | 'composition';

/** Release / maintenance stability. Default is `stable` and renders no chip. */
export type Stability = 'stable' | 'experimental' | 'deprecated';

/** Forms-binding mode. Only set on `@cngx/forms` demos. */
export type Framework = 'signal-forms' | 'reactive-forms' | 'template-only' | 'programmatic';

export interface DemoSpec {
  /** Displayed page heading. Each story is one example, this is its title. */
  title: string;
  /** HTML-bearing subtitle rendered below the title. */
  subtitle?: string;
  /** Optional short description shown beneath the subtitle. */
  description?: string;
  /**
   * Playground controls available in this story.
   * Each control becomes a named field in the generated component class.
   * Access values in templates as `key.value()` (e.g. `selectionMode.value()`).
   */
  controls?: ControlSpec[];
  /**
   * TypeScript class-level statements (fields, methods, lifecycle hooks).
   * Emitted verbatim into the generated component class body.
   *
   * Example: `protected readonly rows = computed(() => PEOPLE.filter(...));`
   */
  setup?: string;
  /**
   * Interactive chrome that backs `templateChrome` — config-toggle signals,
   * fail-flag helpers, log buffers, async-setter methods. Rendered into the
   * live component's class body alongside `setup` but excluded from the
   * displayed TypeScript panel, so the reader sees only artifact-relevant code.
   */
  setupChrome?: string;
  /**
   * Angular template fragment embedded inside the example wrapper.
   * When `controls` is present, the example wraps in `<app-playground>`;
   * otherwise in `<app-example-card>`. This is the artifact itself — the
   * code a consumer would write. Rendered live and shown in the Template panel.
   */
  template: string;
  /**
   * Interactive chrome that pairs with `template` — mode toggles, fail
   * checkboxes, state-readout `event-grid` blocks, retry buttons. Rendered
   * live alongside `template` but stripped from the displayed Template panel
   * so the reader sees only the artifact, not the demo's instrumentation.
   */
  templateChrome?: string;
  /**
   * Angular class names that must appear in the generated `@Component.imports`
   * array. `generate-examples.mjs` resolves import paths from public-api.
   */
  imports?: string[];
  /**
   * Additional TypeScript import statements inserted at the top of the
   * generated component file. Use for fixture imports, rxjs-interop, or any
   * non-Angular-core dep.
   *
   * Example: `["import { PEOPLE, type Person } from '../../../fixtures';"]`
   */
  moduleImports?: string[];
  /**
   * Angular directive/component class names to add as `hostDirectives` on
   * the generated component. Classes must be imported via `moduleImports`.
   */
  hostDirectives?: string[];
  /** Compodoc class names whose API should appear in the API tab. */
  apiComponents?: string[];
  /**
   * Optional CSS snippet shown in the source view CSS tab. Use for
   * demo-specific styling that illustrates CSS custom property usage.
   */
  css?: string;
  /** Composition density of the subject. Renders as the `atomic-level` chip. */
  level?: AtomicLevel;
  /** Reader audiences the demo serves. Renders one chip per value. */
  audience?: readonly Audience[];
  /** Drop-in (`standalone`) vs wire-it-up (`building-block`). */
  artifact?: Artifact;
  /** What this demo illustrates — renders one chip per value. */
  focus?: readonly Focus[];
  /** Stability flag. `stable` renders no chip; `experimental` / `deprecated` do. */
  stability?: Stability;
  /** Forms-binding mode. Only set on `@cngx/forms` demos. */
  framework?: Framework;
}

export type ControlSpec =
  | { key: string; type: 'bool'; label: string; default?: boolean }
  | { key: string; type: 'text'; label: string; default?: string; placeholder?: string }
  | {
      key: string;
      type: 'number';
      label: string;
      default?: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | { key: string; type: 'range'; label: string; min: number; max: number; default: number; step?: number }
  | { key: string; type: 'select'; label: string; options: SelectOption[]; default: string };

export interface SelectOption {
  label: string;
  value: string;
}
