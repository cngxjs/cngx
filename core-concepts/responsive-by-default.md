<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Responsive by Default

<aside class="cc-tldr">

Every component reacts to the width it actually has, with nothing bound. Breakpoints live in the stylesheet, once, as container queries on a rem tier. Where TypeScript needs the answer it reads a custom property the query wrote; it never re-evaluates the condition. Opting out is a CSS property or an input the component already had, never a `[responsive]` flag.

</aside>

A component that needs an attribute before it adapts is not responsive; it is configurable. CNGX ships the adaptation as the default behaviour of the component and leaves the consumer an escape hatch, not a switch.

---

## The four rules

1. **On by default.** A component that can adapt to its width does so without any binding. Opting out is either a CSS custom property or an input that already exists for another reason. No component gains a boolean flag whose only job is enabling its own normal behaviour.
2. **Container, not viewport.** In-flow layout reacts to the width of its container, never to the window. A sidebar nested in a dashboard pane must collapse when the pane is narrow, whatever the window is doing. Viewport media queries stay legitimate for overlay modality (a popover becoming a bottom sheet, a dialog going full-screen) because those surfaces really do belong to the screen.
3. **The breakpoint lives in the stylesheet, once.** A `@container` rule owns the threshold. When TypeScript needs to know the outcome, the rule writes a custom property and the component reads the resolved value. TypeScript never parses a CSS length and never re-implements the condition.
4. **Communicated through state, not narrated.** A structural switch changes `aria-hidden`, `aria-modal`, `aria-expanded`; those are already in the `computed()` graph and are the communication. A live region is added only when the switch interrupts the user's current task and no ARIA state reflects it, which is rare enough that no component ships one today.

---

## The tier table

Container breakpoints come from a fixed set of rem rungs, the same discipline the spacing scale uses. A component picks a rung; it does not invent a literal.

| Rung | Value | At a 16px root |
|-|-|-|
| `xs` | `20rem` | 320px |
| `sm` | `30rem` | 480px |
| `md` | `48rem` | 768px |
| `lg` | `64rem` | 1024px |

The unit is `rem` and not `px` because `CNGX_TEXT_SCALE` sets a real `font-size` on the root. A user at 150% text scale crosses a rem threshold earlier - exactly when the extra glyph width has actually consumed the space. A px threshold would keep the wide layout precisely in the situation that needed the narrow one.

The tier table is a convention, not an exported constant: nothing in TypeScript consumes it, because rule 3 keeps the comparison in CSS. `projects/core/theming/container-query-coverage.spec.ts` enforces it across every library stylesheet.

---

## Declaring a container

An organism names its own container in its own stylesheet and queries that name:

```css
cngx-thing {
  container-type: inline-size;
  container-name: cngx-thing;
}

@container cngx-thing (max-inline-size: 30rem) {
  .cngx-thing__row { grid-template-columns: 1fr; }
}
```

The name is API. An unnamed `@container` matches the nearest container of any name, so a consumer who wraps the component in their own container would silently re-target the query.

Two exceptions:

- **Atoms never declare a container.** `container-type: inline-size` applies size containment, which kills auto-width shrink-wrap. An inline chip, badge or status atom must keep sizing to its content.
- **`max-content` skins are exempt.** A skin whose enclosure is `width: max-content` has its content width zeroed by inline-size containment. `projects/ui/paginator/paginator.component.css` exempts its `bar` skin for exactly this reason.

---

## When TypeScript needs the answer

Purely visual adaptation - padding, column counts, hiding an optional segment - is CSS alone. A *structural* switch is different: when the component renders a different template, moves focus, or flips `aria-modal`, TypeScript has to know.

The rule is not to duplicate the threshold. The `@container` rule writes a custom property, and the component reads the resolved value:

```css
cngx-thing-layout { container-type: inline-size; container-name: cngx-thing-layout; }

cngx-thing-layout > cngx-thing { --cngx-thing-wide: 0; }

@container cngx-thing-layout (min-inline-size: 64rem) {
  cngx-thing-layout > cngx-thing { --cngx-thing-wide: 1; }
}
```

```ts
private readonly container = inject(CNGX_CONTAINER_SIZE, { optional: true });
private readonly wide = this.container?.property('--cngx-thing-wide', this.host) ?? signal('').asReadonly();
readonly effectiveMode = computed(() => (this.wide() === '1' ? 'side' : 'over'));
```

`CNGX_CONTAINER_SIZE` comes from `[cngxContainer]` (`@cngx/common/layout`), which declares the container and exposes `inlineSize`, `blockSize`, `isReady` and `property(name, on?)` as signals. `property()` recomputes on the container's resize; the browser has already re-evaluated the query by then, so the read returns the current value.

**The rule writes on a descendant, never on the container itself.** A `@container` rule resolves against an *ancestor* query container of the element it styles, so a rule whose subject is the container element matches nothing and the property never changes. The value therefore lands on the child that consumes it, and that child is what `property()` reads.

Until the first resize entry arrives the property reads as the empty string and the component takes its narrow branch. The observer's initial callback runs after layout and before paint, so nothing flashes; seeding the value synchronously in a constructor would read before the first layout and return the wrong answer.

---

## Opting out

Three shapes, in order of preference:

- **A CSS custom property**, read through a style query. The paginator keeps its full number row with `--cngx-paginator-collapse: none` on the host or any ancestor. This is the same shape the accordion uses for its marker variants.
- **An input the component already has.** A breadcrumb with an explicit `[maxVisible]` uses that count and stops deriving one from its width. A sidenav with an explicit `mode` pins that mode instead of resolving `auto`.
- **Nothing.** Most visual adaptation has no opt-out and needs none.

A new boolean input whose only purpose is enabling the component's own default behaviour is a Pillar 3 violation and will be rejected in review.

---

## Reference: CngxSidenav

`<cngx-sidenav>` inside `<cngx-sidenav-layout>` needs no binding. `mode` defaults to `'auto'`: the rail docks beside the content when the layout is `lg` or wider and overlays below it. The threshold exists once, in `sidenav-layout.css`. Any explicit `mode` pins that mode at every width.

```html
<cngx-sidenav-layout>
  <cngx-sidenav position="start" [(opened)]="navOpen">…</cngx-sidenav>
  <cngx-sidenav-content><router-outlet /></cngx-sidenav-content>
</cngx-sidenav-layout>
```

---

## Proving it

A container query cannot be evaluated in jsdom. Any component that claims container-driven behaviour carries a `*.geometry.spec.ts` that runs in real Chromium (`ng run <lib>:test-geometry`) and asserts the switch at two widths, using `containerState()` and `computedValue()` from `@cngx/testing/geometry`.
