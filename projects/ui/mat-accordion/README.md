# @cngx/ui/mat-accordion

The Material twin of the cngx accordion, shipped as the instrumentation directive `[cngxMatAccordion]`. Attach it to a vanilla `<mat-accordion>` and it hosts the headless `CngxAccordion` brain (from `@cngx/common/interactive`) via `hostDirectives`. Material consumers gain a controlled `[(openIds)]` group model and single-open arbitration on Material's own markup - neither of which `<mat-accordion>` exposes. Mirrors `[cngxMatStepper]` / `[cngxMatTabs]`.

## What it does

`[cngxMatAccordion]` is the instrumentation pattern: Material owns the rendering, the consumer authors native `<mat-expansion-panel>` markup, cngx is the behaviour layer.

- Composes `CngxAccordion` via `hostDirectives`; forwards `[multi]` and the two-way `[(openIds)]` model (a `ReadonlySet<string>` of open panel ids).
- Assigns a stable id per `<mat-expansion-panel>` it finds (`contentChildren(MatExpansionPanel)`, keyed by `WeakMap`) and keeps each panel's `expanded` in sync with the brain's open-set through `createMatExpansionSetSync` - Material writes wrapped in `untracked()`, the write-back routed through `CngxAccordion.toggle` so single-mode arbitration matches the native `CngxAccordionPanel` DOM path exactly (no reactivity loops, no clamped-out ids left in the model).
- Pins `matAccordion.multi = true` so Material never runs its own single-open close; the brain's `effectiveOpenIds` clamp is the sole arbiter. Bind `[multi]` on `[cngxMatAccordion]` - it feeds the brain (and Material's inherited `multi` input is overridden back to `true`).
- Provides `CNGX_ACCORDION`, so cngx directives that inject the accordion contract compose against Material markup.
- Material owns keyboard navigation (arrow / Home / End header roving via its own `FocusKeyManager`), focus, and every header ARIA attribute (`role`, `aria-expanded`, `aria-controls`) - the directive re-renders and re-implements none of it.

There is no cngx skin: the directive renders no DOM of its own, so it ships no styles and no `@cngx/themes` bridge. Theme the panels through Material's own `mat.expansion` theme.

## Exports

| Export | Selector / exportAs | Description |
|-|-|-|
| `CngxMatAccordion` | `[cngxMatAccordion]` / `cngxMatAccordion` | Instrumentation directive for `<mat-accordion>`. |

## Usage

Bind `[(openIds)]` to a `ReadonlySet<string>` signal and `[multi]` to pick single- or multi-open. The consumer authors native `<mat-expansion-panel>` markup unchanged.

```html
<mat-accordion cngxMatAccordion [(openIds)]="openIds" [multi]="false">
  <mat-expansion-panel>
    <mat-expansion-panel-header>Personal info</mat-expansion-panel-header>
    <p>Tell us who you are.</p>
  </mat-expansion-panel>

  <mat-expansion-panel>
    <mat-expansion-panel-header>Account</mat-expansion-panel-header>
    <p>Choose your sign-in method.</p>
  </mat-expansion-panel>
</mat-accordion>
```

```ts
protected readonly openIds = signal<ReadonlySet<string>>(new Set());

// Programmatic control — collapse everything:
this.openIds.set(new Set());
```

In single mode (`[multi]="false"`) opening a panel collapses its siblings and `openIds()` holds exactly the last-opened id. In multi mode every open panel's id is present. The set is the single source of truth: seed it to pre-open panels, read it to observe expansion, write it to drive expansion - no per-panel `[expanded]` bookkeeping.
