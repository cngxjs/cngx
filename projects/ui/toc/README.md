# CngxToc

"On this page" navigation rail. Renders a labeled `<nav>` of anchor links from
a tree of items, tracks the most-visible section as you scroll, and reflects it
on `aria-current`. Composition over an unused atom: the active-section
detection is `CngxScrollSpy`, bound inside the organism's own template, so the
component ships zero `IntersectionObserver` code.

## Import

```typescript
import { CngxToc, CngxTocItemSlot, CngxTocRouterSync, type CngxTocItem } from '@cngx/ui/toc';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxToc, type CngxTocItem } from '@cngx/ui/toc';

@Component({
  selector: 'app-example',
  template: `
    <cngx-toc [items]="toc" contentRoot="#article"></cngx-toc>
    <article id="article">
      <section id="intro">...</section>
      <section id="usage">...</section>
    </article>
  `,
  imports: [CngxToc],
})
export class ExampleComponent {
  protected readonly toc: CngxTocItem[] = [
    { id: 'intro', label: 'Introduction' },
    { id: 'usage', label: 'Usage', children: [{ id: 'usage-cli', label: 'CLI' }] },
  ];
}
```

`[items]` is the outline; each `id` targets a section element the link scrolls
to. `contentRoot` is the scroll container's CSS selector - leave it off to
observe the viewport. `[rootMargin]` and `[threshold]` pass straight through to
the internal spy.

## Overview

The organism owns very little. Active-section detection is `CngxScrollSpy`
(`@cngx/common/layout`), bound on the rail's own `<nav>` and read back through a
`viewChild`. The flat id list the spy observes and the ancestor `data-active-trail`
chain are both `computed()` from `[items]`, each with a shared element-wise
`equal` so a scroll tick never re-allocates the arrays.

Exactly one link carries `aria-current` at a time. Ancestor links of the active
leaf get a `data-active-trail` attribute (a styling hook, no ARIA).

## Nav of links, not a tree

A table of contents is a **navigation landmark containing links**. Nesting is
communicated structurally - nested `<ul>` and indentation - so native tab order,
Enter-to-navigate, middle-click and screen-reader link lists all keep working.
The APG treeview pattern (composite widget, one tab stop, active-descendant) is
deliberately **not** applied: it would break link semantics.

Reach for `CngxSidenav` instead when you need a collapsible primary-navigation
rail with a selection model. `CngxToc` is a passive reflection of scroll
position, not a navigation state machine.

## Activation, reduced motion and focus

Clicking (or pressing Enter on) a link takes over the native anchor jump,
scrolls the section into view, and moves focus to it so a screen reader reads
from the new position - a visual-only jump is a silent state change. The scroll
behaviour is the configured `scrollBehavior` (`'smooth'` by default), swapped to
`'auto'` (instant) whenever `prefers-reduced-motion: reduce` matches.

**Focus contract.** The section elements are consumer-owned DOM. To make an
arbitrary section programmatically focusable, `CngxToc` sets `tabindex="-1"` on
the target **only** when it is not focusable by default and carries no
author-set `tabindex`; an author value is never overwritten. This is a
documented, persistent mutation of borrowed DOM.

## Item slot

Project an `<ng-template cngxTocItem>` to replace the built-in label. The
context exposes the item, its `active` state and its `depth`:

```html
<cngx-toc [items]="toc" contentRoot="#article">
  <ng-template cngxTocItem let-item let-active="active">
    <span [style.font-weight]="active ? 600 : 400">{{ item.label }}</span>
  </ng-template>
</cngx-toc>
```

Resolution is three-stage: the per-instance slot, then
`CNGX_TOC_CONFIG.templates.item`, then the built-in plain label.

## Router fragment sync

`[cngxTocRouterSync]` on the same host deep-links the active section into the
URL fragment. Activating a link writes `#<section-id>` (replacing the history
entry, so a scroll-driven rail never floods the back stack); a deep link like
`/guide#pricing` scrolls to that section once on load. The directive reaches the
rail through the `CNGX_TOC` contract token, never the concrete class, and its
activation subscription is torn down with the directive. Without
`@angular/router` it dev-warns once and no-ops.

```html
<cngx-toc cngxTocRouterSync [items]="toc" contentRoot="#article"></cngx-toc>
```

## Configuration

```typescript
provideTocConfig(
  withTocAriaLabels({ nav: 'On this page' }),
  withTocScrollBehavior('smooth'),
  withTocSpy({ rootMargin: '-80px 0px 0px 0px' }),
  withTocTemplates({ item: myItemTemplate }),
);
```

Root, or scoped to a subtree with `provideTocConfigAt` in `viewProviders`, where
features merge onto the parent config rather than replacing it. Resolution runs
per-instance input, then the scoped provider, then root, then the library
default. Defaults are English; supply your locale through the cascade.

## Material Theme

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/toc-theme' as toc;

html {
  @include toc.theme($theme);
}
```

Without the bridge the rail uses the cngx foundation `--cngx-color-*` tokens
(light/dark aware) with a native look; the bridge maps the link, active and
focus-ring colours onto `--mat-sys-*`. Spacing stays on `--cngx-space-*` so
density tracking keeps working.

## See Also

- [CngxScrollSpy](../../common/layout/) - the detection atom the rail composes
- [CngxSidenav](../sidenav/) - collapsible primary-navigation rail
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/ui/toc/toc.component.spec.ts`, `toc-router-sync.directive.spec.ts`
