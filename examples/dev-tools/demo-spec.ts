/**
 * Typed contract for `*.story.ts` files.
 *
 * Story files are pure TypeScript data — no Angular imports, no runtime deps.
 * They are consumed by `scripts/generate-examples.mjs` to produce naked
 * example components under `examples/src/app/features/**`, plus the routes
 * + metadata files the home directory listing reads from.
 */

/** Composition density of the underlying symbol. Toolkit-agnostic. */
export type AtomicLevel = 'atom' | 'molecule' | 'organism';

/** Reader audience the demo serves. */
export type Audience = 'dev' | 'design' | 'a11y';

/** Whether the demo's subject drops in (`standalone`) or needs wiring (`building-block`). */
export type Artifact = 'standalone' | 'building-block';

/** What aspect of the symbol a demo / section illustrates. */
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
  /** Displayed title of the demo page heading. */
  title: string;
  /** Short label for the sidebar nav. Falls back to `title` if not set. */
  navLabel?: string;
  /**
   * Nav category override. By default the generator groups by filesystem path
   * (e.g. `behaviors/`). Set this to group under a specific entry point name
   * (e.g. `'data'` for `@cngx/common/data`).
   */
  navCategory?: string;
  /** Optional description shown as a subtitle on the page. */
  description?: string;
  /**
   * Playground controls available in all sections.
   * Each control becomes a named field in the generated component class.
   * Access values in templates as `key.value()` (e.g. `selectionMode.value()`).
   */
  controls?: ControlSpec[];
  /**
   * Shared TypeScript class-level statements (fields, methods, lifecycle hooks)
   * available across all sections. Emitted verbatim into the generated component
   * class body before any section-level setup.
   *
   * Example: `protected readonly rows = computed(() => PEOPLE.filter(...));`
   */
  setup?: string;
  /**
   * Additional TypeScript import statements inserted at the top of the generated
   * component file, after the Angular core imports and before the @Component
   * decorator. Use for fixture imports, rxjs-interop, or any non-Angular-core dep.
   *
   * Example: `["import { PEOPLE, type Person } from '../../../fixtures';"]`
   */
  moduleImports?: string[];
  /**
   * Angular directive/component class names to add as `hostDirectives` on the
   * generated component. Classes must be imported via `moduleImports`.
   * Also adds `inject` to the Angular core imports automatically.
   *
   * Example: `['CngxSort', 'CngxFilter']`
   */
  hostDirectives?: string[];
  /**
   * Compodoc class names whose API should appear in the API tab.
   * Example: `['CngxSort', 'CngxSortHeader']`
   */
  apiComponents?: string[];
  /**
   * Longer overview text for the Overview tab. Supports HTML.
   * Falls back to `description` if not set.
   */
  overview?: string;
  /** Composition density of the subject. Renders as the `atomic-level` chip. */
  level?: AtomicLevel;
  /** Reader audiences the demo serves. Renders one chip per value. */
  audience?: readonly Audience[];
  /** Drop-in (`standalone`) vs wire-it-up (`building-block`). */
  artifact?: Artifact;
  /** Story-level default for the `focus` chips. Section-level may override. */
  focus?: readonly Focus[];
  /** Stability flag. `stable` renders no chip; `experimental` / `deprecated` do. */
  stability?: Stability;
  /** Forms-binding mode. Only set on `@cngx/forms` demos. */
  framework?: Framework;
  /** At least one section (= one ExampleCard). */
  sections: [SectionSpec, ...SectionSpec[]];
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

export interface SectionSpec {
  title: string;
  /** HTML string rendered via innerHTML in ExampleCard subtitle. */
  subtitle?: string;
  /**
   * Angular template fragment embedded inside the section wrapper.
   * When controls are present, the first section wraps in `<app-playground>`.
   * All other sections wrap in `<app-example-card>`.
   */
  template: string;
  /**
   * TypeScript class-level statements for this section (fields, methods).
   * Emitted verbatim into the generated component class body.
   *
   * Example: `readonly lastClicked = signal<string | null>(null);`
   */
  setup?: string;
  /**
   * Angular class names that must appear in the `@Component.imports` array.
   * `generate-demos.mjs` resolves import paths from compodoc JSON.
   *
   * Example: `['CngxSort', 'CngxSortHeader']`
   */
  imports?: string[];
  /**
   * Optional CSS snippet shown in the source view CSS tab.
   * Use for demo-specific styling that illustrates CSS custom property usage.
   */
  css?: string;
  /**
   * Section-level override for the `focus` chips. When set, replaces the
   * story-level `focus` for this section only.
   */
  focus?: readonly Focus[];
  /**
   * Section-level override for the `artifact` chip. Use when a single story
   * mixes drop-in usage with explicit composition (e.g. `select-demo`
   * contains both standalone `<cngx-select>` sections and an
   * "assemble it yourself" building-block section).
   */
  artifact?: Artifact;
  /**
   * Section-level override for the `framework` chip. Use when a story
   * demonstrates multiple binding paths across sections.
   */
  framework?: Framework;
}
