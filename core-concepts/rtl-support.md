<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# RTL Support

<aside class="cc-tldr">

Set `dir="rtl"` on the host. Layout, horizontal keyboard semantics, popover and tooltip placement, directional glyphs, and numeric islands all mirror on their own. There is no per-component RTL flag to turn on.

</aside>

CNGX reads the writing direction the DOM already owns and mirrors every direction-sensitive surface from it. Right-to-left is not a mode you switch a component into; it is a document attribute the library observes. A consumer opts in in exactly one place and the rest follows.

---

## The single opt-in

Set `dir` on the document, or on any host that scopes a subtree:

```html
<html dir="rtl">
```

That is the whole opt-in. Under Angular i18n the framework already sets `<html dir>` from the active locale, so a localized RTL build needs no extra CNGX wiring. Everything below reacts to that attribute; nothing in the library sets it, and no component takes an `[rtl]` input.

---

## The direction primitive

One read-only signal carries the direction through the component graph.

### `injectDirection()`

Returns a `Signal<'ltr' | 'rtl'>`. It resolves the document-root `dir` and re-signals when the root flips at runtime. It is read-only: CNGX reports the direction the DOM owns, it never writes it.

```ts
import { injectDirection } from '@cngx/core';

readonly direction = injectDirection(); // Signal<'ltr' | 'rtl'>
```

The token behind it is `CNGX_DIRECTION` (`InjectionToken<Signal<CngxDirection>>`, `providedIn: 'root'`). Override the token directly when the reported direction must come from a reactive source such as a router-derived locale signal:

```ts
{ provide: CNGX_DIRECTION, useFactory: () => myLocaleDirection }
```

### `provideDirection(value)`

Environment-scoped override. Returns `EnvironmentProviders`, so it belongs in bootstrap `providers` or route `providers`. It forces what `injectDirection()` reports without touching `documentElement.dir`, installs no observer, and never writes the DOM. Use it in tests or in SSR with a known locale.

```ts
bootstrapApplication(AppComponent, {
  providers: [provideDirection('rtl')],
});
```

### `provideDirectionAt(value)`

Element-injector twin of `provideDirection`. Returns `Provider[]`, so it goes in a component's `viewProviders` (or `providers`). It forces the direction `injectDirection()` reports for that DI subtree, again without touching the DOM. Reach for it when a composite's keyboard-navigation logic must honour a forced subtree direction; an element injector rejects the `EnvironmentProviders` that `provideDirection` returns, which is why the two entry points are separate.

```ts
@Component({
  selector: 'rtl-panel',
  viewProviders: [provideDirectionAt('rtl')],
})
export class RtlPanel {}
```

### `CngxDir` (`[cngxDir]`)

Reflects its value onto the host `[attr.dir]`, scoping CSS logical properties and native bidi for a subtree. This is the DOM-and-CSS escape hatch: a right-to-left island inside an LTR document, or an LTR code block inside an RTL one.

```html
<section cngxDir="rtl"> ... </section>
```

`CngxDir` changes what the browser lays out, not what `injectDirection()` reports; the reader stays document-root scoped. A subtree whose keyboard-navigation logic must also honour the forced direction pairs `CngxDir` with `provideDirectionAt(...)` in its `viewProviders`.

---

## What mirrors automatically

Once `dir="rtl"` is set, these behaviours flip without any per-component configuration:

- **CSS-logical layout.** Components lay out on the inline axis with logical properties (`margin-inline`, `inset-inline`, `padding-inline`), so the whole run mirrors from the direction attribute alone, with no second stylesheet.
- **Horizontal keyboard semantics.** Arrow-key navigation follows the WAI-ARIA APG: the physical `ArrowLeft` / `ArrowRight` keys swap their inline-forward and inline-back meaning under RTL, while the block axis (`ArrowUp` / `ArrowDown`, `Home` / `End`) stays fixed. This covers roving toolbars, menus and submenus, context menus, tabs, steppers, trees, sliders, reorderable lists, and chip strips.
- **Popover and tooltip placement.** Anchor placement mirrors on the inline axis: an inline-start popover opens on the right under RTL, submenus swap the side they fly out to, and `*-start` / `*-end` alignment follows the reading direction.
- **Directional glyphs.** Glyphs that encode a direction (disclosure carets, tree twisties, chevrons, drag affordances) mirror so they still point the reading way.
- **Numeric islands.** Numbers, code, and other left-to-right runs render as isolated bidi islands, so a digit sequence keeps its LTR order inside RTL prose instead of reordering.

---

## Scoped overrides

Two escape hatches cover the cases where a subtree must differ from the document:

- **DI-scoped forced direction.** `provideDirectionAt('ltr')` in a component's `viewProviders` forces what `injectDirection()` reports for that subtree, so keyboard-navigation logic in a forced-LTR island behaves LTR even inside an RTL document.
- **CSS and bidi-only island.** `CngxDir` (`[cngxDir]`) flips layout and native bidi for a subtree without changing the reported direction. Use it for a purely visual island where no direction-dependent TS logic runs.

Pair them when a subtree needs both: `cngxDir` for the CSS and bidi flip, `provideDirectionAt(...)` in `viewProviders` so the navigation logic agrees.

---

## RTL keyboard and anchor coverage

Every keyboard family and every anchor family that reacts to direction ships an RTL end-to-end assertion, so a family cannot lose its mirror without a test going red. The matrix below maps each family to the spec that proves it under `dir="rtl"`.

|Family|What mirrors|RTL spec|
|-|-|-|
|Roving toolbar, menu, submenu, context menu, tree|Inline arrow keys|`rtl-keyboard-listbox-menu-tree.spec.ts`|
|Standalone hierarchical-nav tree|Expand / collapse arrows|`rtl-hierarchical-nav.spec.ts`|
|Tabs, stepper, tab overflow|Inline arrow keys|`rtl-keyboard-tabs-stepper.spec.ts`|
|Slider, reorderable multi-select, chip strip|Inline arrow keys|`rtl-keyboard-slider-reorder.spec.ts`|
|Popover, tooltip, menu, context menu, tree-select|Anchor placement geometry|`rtl-anchor-positioning.spec.ts` (Chromium only)|
|Paginator nav row|Inline-axis layout|`css-contract-rtl.spec.ts`|
|Timeline horizontal run|Inline-axis layout|`timeline-layout.spec.ts`|
|Sidenav and sibling organisms|CSS-logical layout|Per-organism geometry specs (for example `sidenav.geometry.spec.ts`)|

Anchor geometry is asserted in Chromium only: the examples app wires no floating-ui fallback, and CSS Anchor Positioning is Chromium-only today, so the geometry path is Chromium-only by construction.

The sweep found one uncovered family: the standalone hierarchical-nav tree runs the same keyboard strategy as tree-select but on its own `role="tree"` route, which no existing spec touched. That gap is closed here by `rtl-hierarchical-nav.spec.ts`. The breadcrumb strip was checked and needs no RTL keyboard spec: it navigates with Tab between links and runs no direction-dependent arrow logic. No family is left unmapped.
