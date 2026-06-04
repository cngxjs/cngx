# examples-gen

The generator that turns `examples/stories/**/*.story.ts` into the
runnable example components under `examples/src/app/features/**`.
One story file equals one rendered example.

Run via `npm run examples:generate` (or any of the wrappers — `npm
start`, `npm run build:examples` and their `:examples` aliases fire
the generator as a `pre*` hook). The generated tree is gitignored;
CI regenerates it before building.

## Story layout

```
examples/stories/<lib>/<category>/<demo>/<example>.story.ts
        forms /  select  / single-select / clearable.story.ts
```

The path becomes:

| Artifact | Value |
|-|-|
| route | `/forms/select/single-select/clearable` |
| component file | `examples/src/app/features/forms/select/single-select/clearable.component.ts` |
| component class | `SingleSelectClearable` |
| selector | `app-single-select-clearable` |
| sidebar | `forms > select > single-select > Clearable` |

`<lib>` is one of `forms` / `common` / `ui` / `data-display` /
`core` / `utils`. `<category>` is the cngx library sub-entry
(`@cngx/forms/select`, `@cngx/common/a11y`, ...). Deeper nesting is
fine; navigation derives from the path.

## DemoSpec — the contract

Every story exports a single `STORY` constant typed as `DemoSpec`
(`examples/dev-tools/demo-spec.ts`). Fields:

| Field | Purpose |
|-|-|
| `title` | Required. The h1 shown above the example. |
| `subtitle` | Optional. HTML-bearing line below the title. Use `<code>` for inline API mentions. |
| `description` | Optional. Short paragraph below the subtitle. HTML allowed. |
| `level` | `'atom'` / `'molecule'` / `'organism'`. Composition density of the subject. |
| `audience` | Multi: `'dev'` / `'design'` / `'a11y'`. Who the demo serves. |
| `artifact` | `'standalone'` (drop-in component) or `'building-block'` (directive that needs wiring). |
| `focus` | Multi: `'visual-variants'`, `'behavior'`, `'a11y-pattern'`, `'integration'`, `'error-handling'`, `'async-state'`, `'composition'`. What the example illustrates. |
| `stability` | `'stable'` (default, no chip) / `'experimental'` / `'deprecated'`. |
| `framework` | `'signal-forms'` / `'reactive-forms'` / `'template-only'` / `'programmatic'`. Forms-area only. |
| `apiComponents` | List of cngx class names the API tab should surface. |
| `moduleImports` | Extra `import …;` lines emitted at the top of the generated component file. Filtered to what's actually referenced. |
| `imports` | Class names that go into the component's `@Component.imports` array. |
| `hostDirectives` | Class names attached to the host element via `hostDirectives`. Required when a service uses `inject(X, { host: true })`. |
| `setup` | TypeScript class-body statements for the **artifact**. Emitted into the live class AND shown in the TypeScript code panel. |
| `template` | Angular template fragment for the **artifact**. Rendered live AND shown in the Template code panel. |
| `setupChrome` | TypeScript class-body for **demo chrome** — mode toggles, fail flags, log buffers. Live in the class, hidden from the displayed TypeScript panel. |
| `templateChrome` | Template fragment for **demo chrome** — radio rows, fail checkboxes, state readouts. Live below the artifact, hidden from the displayed Template panel. |
| `templateChromeBefore` | Chrome that should render **above** the artifact instead of below: usage hints, intro callouts. Same stripping rules as `templateChrome`. |
| `references` | Optional `readonly { label; href }[]`. Standards / patterns the artifact implements (WAI-ARIA APG, WCAG SC, RFC numbers). Rendered as a small `Implements: …` link list in the intro header. |
| `css` | Optional. Demo-specific CSS shown in the source view. |
| `controls` | Optional playground controls. Each becomes a named field on the class; access in templates as `key.value()`. |

## Artifact vs chrome

The split exists so the displayed code panels show only what the docs
are supposed to teach. Live rendering uses both halves; the displayed
source uses only `template` / `setup`.

| Half | Contents |
|-|-|
| **Artifact** | The component or directive the page documents — the single `<cngx-…>` tag, the directive applied to its host, the form-field wiring. |
| **Chrome** | Interactive instrumentation around the artifact — mode-switch radios, "Server fails" checkboxes, state-readout `event-grid`, commit log. |

Chrome conventions in templates:

```html
<div class="button-row">…</div>      <!-- toggles, checkboxes, retry buttons -->
<div class="event-grid">…</div>      <!-- state readouts -->
<div class="event-row">…</div>       <!-- single readout row -->
<div class="status-row">…</div>      <!-- status badges -->
<div class="cngx-ex-chrome">…</div>  <!-- explicit opt-in marker -->
```

These classes carry their styling from `examples/src/styles.scss` and
double as the markers the generator falls back to if a story still
puts chrome in `template`. New stories should write chrome into
`templateChrome` directly.

A setup decl belongs in `setupChrome` when it's only read or written
by `templateChrome`. If both halves use it (`commitMode` is set by
the chrome's radios and read by the artifact's `[commitMode]` input),
keep it in `setup` — the artifact's data wins.

## A minimal story

```ts
import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Clearable',
  subtitle: '<code>[clearable]="true"</code> adds a ✕ button when a value is selected.',
  description: 'CngxSelect — native single-select with template overrides.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxSelect'],
  moduleImports: ["import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';"],
  imports: ['CngxSelect'],
  setup: `
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly value = signal<string | undefined>('red');`,
  template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="value"
    [clearable]="true"
  />`,
};
```

## A story with chrome

```ts
export const STORY: DemoSpec = {
  title: 'Commit action — optimistic / pessimistic',
  // ... metadata as above
  setup: `
  protected readonly colors: CngxSelectOptionDef<string>[] = [ /* … */ ];
  protected readonly value = signal<string | undefined>('red');
  protected readonly commitMode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly commitAction = (intended: string) => of(intended).pipe(delay(700));`,
  template: `
  <cngx-select
    [label]="'Color'"
    [options]="colors"
    [(value)]="value"
    [commitAction]="commitAction"
    [commitMode]="commitMode()"
  />`,
  setupChrome: `
  protected readonly commitLog = signal<string[]>([]);
  protected readonly commitShouldFail = signal(false);`,
  templateChrome: `
  <div class="button-row">
    <label>
      <input type="radio" name="m" value="optimistic"
        [checked]="commitMode() === 'optimistic'"
        (change)="commitMode.set('optimistic')" />
      Optimistic
    </label>
    <label>
      <input type="radio" name="m" value="pessimistic"
        [checked]="commitMode() === 'pessimistic'"
        (change)="commitMode.set('pessimistic')" />
      Pessimistic
    </label>
  </div>
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Value</span>
      <span class="event-value">{{ value() ?? '—' }}</span>
    </div>
    @for (entry of commitLog(); track entry) {
      <div class="event-row">
        <span class="event-label">commit</span>
        <span class="event-value">{{ entry }}</span>
      </div>
    }
  </div>`,
};
```

The Template panel shows only the `<cngx-select>` block. The
TypeScript panel shows `colors`, `value`, `commitMode`, `commitAction`
— but not `commitLog` or `commitShouldFail`. The live iframe renders
all of it.

## Things the generator does for you

- Auto-injects Angular core imports (`ChangeDetectionStrategy`,
  `Component`, plus `signal` / `computed` / `inject` / etc. detected
  from your setup).
- Filters `moduleImports` to drop named bindings nothing references.
- Filters `imports` (the `@Component.imports` array) to drop cngx
  classes whose selectors don't appear in the template.
- Resolves cngx symbol → package path via `projects/**/public-api.ts`.
  You usually don't need to spell out `moduleImports` for cngx symbols
  unless aliased.
- Rewrites `../../fixtures/...` paths to the depth of the generated
  component.
- Copies co-located helper files referenced as `from './foo'` in
  `moduleImports` into the feature directory.

## Things the generator does NOT do

- Lint or format the story file. Run `npm run lint` to check the
  generator itself; story files are excluded from ESLint (they're
  pure data, not application code).
- Validate that the story actually renders. `examples:generate`
  succeeds even on broken stories; the typescript-compiler catches
  invalid templates at `build:examples`.
- Detect dead chrome — a story can leave config controls in `template`
  and the displayed Template panel scrubs the chrome-class divs as a
  defensive fallback, but the right fix is to move them to
  `templateChrome`. See `cngx-examples-audit` for batch checks.

