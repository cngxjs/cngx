<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Atomic Decompose

> **An organism is a brain (behaviour shared via a contract token) plus a skin (template and structural CSS); consumers can eject the skin without rewriting their wiring.**

The first question a serious team asks before adopting a component library is the exit question:

> "If we ship our design system on top of this, can we take the visuals back later without rewriting our consumer code?"

CNGX is built so the answer is **yes**.

Every organism is authored as two seams the consumer can separate:

- A **brain** (behaviour, state, ARIA, focus, async lifecycle) that stays linked from the library and keeps receiving updates.
- A **skin** (template, structural CSS, themable tokens) that the consumer can eject into their own source tree and own outright.

The exit is mechanical, not a rewrite.

This page is about the contract that makes that split work. The [Instrumentation Pattern](instrumentation-pattern.md) doc covers the same idea applied to Angular Material; here we describe the CNGX-internal authoring rules every organism follows so the decompose split lands cleanly.

---

## The contract token

The split is held together by `InjectionToken<TContract>` declarations.

- The interface is the public seam.
- The class that satisfies the interface is private to the lib.
- Consumers, sibling components, and the ejected skin all talk to the token, never to the class.

### Canonical example

The canonical example is the form-field control contract in `projects/core/tokens/form-field-control.token.ts:22-53`:

```typescript
export interface CngxFormFieldControl {
  readonly id: Signal<string>;
  readonly focused: Signal<boolean>;
  readonly empty: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly errorState: Signal<boolean>;
  focus?(options?: FocusOptions): void;
}

export const CNGX_FORM_FIELD_CONTROL = new InjectionToken<CngxFormFieldControl>(
  'CngxFormFieldControl',
);
```

Five signals plus an optional `focus()` method. That is the entire surface the host needs to render ARIA, run focus management, and react to state.

Anything that fulfils this shape is a valid control:

- `CngxSelect`
- `CngxMultiSelect`
- `CngxButtonToggleGroup`
- A custom organism the consumer writes after decompose

They all participate in the same form-field machinery without sharing a class.

### Where the token lives

The token lives in `@cngx/core/tokens` (Level 1), not in `@cngx/forms/field` (Level 3). This is deliberate.

Level-2 atoms in `@cngx/common/*` can provide the token and integrate with form-fields without importing Level-3 code. The contract is a Level-1 interface; only the implementations are higher up.

---

## Three decompose levels

Decompose targets are scoped by atomic level.

CLAUDE.md spells out the rule, and the [The CNGX Way](the-cngx-way.md) page documents the taxonomy in detail. The operational consequence is short.

### The taxonomy

|Level|Example|Decompose?|
|-|-|-|
|Atom|`CngxRovingTabindex`, `CngxFocusTrap`, `CngxActiveDescendant`, `CngxLiveRegion`|No (terminal unit)|
|Molecule|`CngxListboxTrigger`, `CngxPopoverTrigger`, `CngxOption`|No (terminal unit)|
|Organism|`CngxSelect`, `CngxTreeSelect`, `CngxFormField`, `CngxStepper`, `CngxButtonToggleGroup`|Yes|

### Why atoms and molecules are terminal

Atoms and molecules have nothing to eject. They are headless directives or single-responsibility units; their entire surface is behaviour.

If you want to swap how an atom looks, you do not eject it. You compose a different organism that uses the same atom under a different template.

Only organisms carry a template and a stylesheet, which is exactly what decompose ejects.

The brain underneath stays in the library:

- The host directives
- The contract tokens
- The controller factories

---

## The brain stays, the skin ejects

`CngxSelect` in `projects/forms/select/single-select/select.component.ts:151-176` is the reference implementation. Look at what the `@Component` block carries:

```typescript
@Component({
  selector: 'cngx-select',
  imports: [CngxClickOutside, CngxListbox, CngxListboxTrigger, CngxPopover, CngxPopoverTrigger, CngxSelectPanel, NgTemplateOutlet],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelect },
    { provide: CNGX_STATEFUL, useFactory: ... },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxSelect },
  ],
  template: `...`,
  styleUrls: ['./select.component.css'],
})
export class CngxSelect<T = unknown> implements CngxFormFieldControl { ... }
```

### What ejects vs what stays linked

When a consumer runs decompose on `CngxSelect`, the seam runs through that `@Component` block:

**What ejects into the consumer's source:**

- The template (the `<div role="combobox">` shell, the trigger markup, the panel outlet)
- `select.component.css` (the structural layout)
- The minimal `@Component` metadata around the ejected class

**What stays linked from the library:**

- The behaviour atoms in `imports`: `CngxClickOutside`, `CngxListbox`, `CngxListboxTrigger`, `CngxPopover`, `CngxPopoverTrigger`, `CngxSelectPanel`
- Every contract token in `providers` (`CNGX_FORM_FIELD_CONTROL`, `CNGX_STATEFUL`, `CNGX_SELECT_PANEL_HOST`, `CNGX_SELECT_PANEL_VIEW_HOST`)
- The shared `createSelectCore<T, TCommit>` factory and the 18 override factories the select family declares
- The form-field integration (every host that consumes `CNGX_FORM_FIELD_CONTROL`)

The ejected class still implements `CngxFormFieldControl`. It still provides the same four tokens. It still imports the same six host directives.

The consumer owns the visuals; the library owns the brain.

### The empty-shell variant

A second pattern shows up in `CngxFormField` itself.

The component class in `projects/forms/field/form-field.component.ts:48-56` is empty:

```typescript
@Component({
  selector: 'cngx-form-field',
  template: `<ng-content />`,
  hostDirectives: [
    CngxErrorScopeFieldBridge,
    { directive: CngxFormFieldPresenter, inputs: ['field'] },
  ],
})
export class CngxFormField {}
```

The brain is `CngxFormFieldPresenter` (a Level-2 host directive in `projects/forms/field/form-field-presenter.ts:48-64`). The skin is `<ng-content />` plus a few CSS class hooks.

After decompose the consumer can replace the template with whatever wrapper markup their design system wants. The presenter still owns `inputId`, `describedById`, `ariaInvalid`, error reveal, and every other ARIA derivation.

---

## The slot registry

Not every consumer wants to eject.

Most of the time the visuals are 90% correct and they only need to swap one piece:

- The caret
- The empty state
- The option label
- The trigger placeholder

The select family handles this with seventeen named template slots and a registry that resolves them.

### Slot directives

The slot directives live in `projects/forms/select/shared/template-slots.ts`. Three real examples:

- `*cngxSelectCheck` (`template-slots.ts:269`) - overrides the selection indicator inside each option.
- `*cngxSelectCaret` (`template-slots.ts:315`) - overrides the trigger caret glyph.
- `*cngxSelectEmpty` (`template-slots.ts:453`) - overrides the "no options" panel.

### Registry resolution

The component resolves them through `CNGX_TEMPLATE_REGISTRY_FACTORY` (`projects/forms/select/single-select/select.component.ts:422`):

```typescript
protected readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
  check: this.checkDirective,
  caret: this.caretDirective,
  optgroup: this.optgroupDirective,
  placeholder: this.placeholderDirective,
  empty: this.emptyDirective,
  loading: this.loadingDirective,
  // ...
});
```

### Consumer-side authoring

Authoring a slot consumer-side is a one-liner:

```html
<cngx-select [field]="f.country" [options]="countries">
  <ng-template cngxSelectEmpty>No countries match your filter.</ng-template>
</cngx-select>
```

This is the middle path between theming and full decompose. The brain runs unchanged, the structural skin stays, and the consumer overrides a single visual fragment.

<aside class="cc-tip">

**Tip.** Defaults can be supplied application-wide via `CNGX_SELECT_CONFIG.templates`, so a team's house style ships once instead of being repeated per usage.

</aside>

---

## The Bridge-input rule

When you write a directive that injects a host contract (like `CNGX_STATEFUL`) as an optional fallback, the directive must accept its driver input as **optional**, not required.

The reason is decompose-symmetric. The same directive must run with the input bound *or* with the input absent (fallback via DI), and `input.required()` would fail at instantiation in the second mode.

### The optional-string-transform shape

Use the optional-string-transform shape:

```typescript
readonly state = input<CngxAsyncState<unknown> | undefined, CngxAsyncState<unknown> | '' | undefined>(
  undefined,
  { alias: 'cngxToastOn', transform: (v) => (typeof v === 'string' ? undefined : v) },
);
```

### Real-world callers

Real example: `[cngxToastOn]`, `[cngxBannerOn]`, and `[cngxAlertOn]` follow this rule.

They accept an explicit `[state]` binding when the consumer wants to point them at a specific signal. They fall back to `CNGX_STATEFUL` injection when they sit inside an organism that provides it (`CngxSelect`, `CngxStepper`, `CngxMatStepperBridge`).

Both shapes survive decompose.

<aside class="cc-note">

**Note.** Pure data inputs (no DI fallback) are unaffected and can stay required.

</aside>

---

## When to decompose

Three knobs, in increasing order of disruption:

### The three knobs

1. **Theme tokens.** Need different colours, spacings, font sizes? Override the `--cngx-*` CSS custom properties on a parent selector. The library publishes fallback defaults; consumer values win. No code changes.
2. **Slot template.** Need a different caret glyph, empty state, or option row layout? Project a `*cngxSelect...` slot template. The structural shell and the brain are untouched.
3. **Decompose.** Need a fundamentally different visual identity - different DOM structure, a different shell component, a layout the slot registry cannot express? Eject the skin. The brain stays linked from the library.

### The escalation signal

If you find yourself reaching for decompose to change a colour, stop. Use a theme token.

If you find yourself nesting four slots to fight the default shell, that is the signal that decompose is the right move.

---

## What you keep when you decompose

The exit budget is the point.

When the consumer ejects `CngxSelect`'s skin, they inherit a flat HTML file plus a CSS file.

They do **not** inherit:

### What stays in the library

- Keyboard navigation (lives in `CngxListbox` + `CngxListboxTrigger`, still composed via `imports`)
- Active-descendant focus management (lives in `CngxActiveDescendant`)
- ARIA wiring for the combobox role (lives in the host bindings backed by `triggerAria()` computed signals)
- Selection semantics (lives in `createSelectionController<T>`, injected via `CNGX_SELECTION_CONTROLLER_FACTORY`)
- The async-commit lifecycle (lives in `createCommitController` and the `CngxAsyncState<T>` view)
- The form-field integration (lives behind `CNGX_FORM_FIELD_CONTROL`)
- The 17 slot directives (still re-projectable from the new shell)
- The 18 override tokens that let the consumer further customise selection, commit, panel hosting, announcement, focus, and template registration

### The trade

Those guarantees travel with the brain.

Every library update that fixes a keyboard regression, tightens a focus restore, or adjusts an ARIA attribute reaches the decomposed consumer without a re-eject.

That is the trade. The consumer gets total visual freedom and the maintenance contract on the parts they did not touch.
