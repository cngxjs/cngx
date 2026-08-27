# menu-trigger-needs-popover-anchor

Require `cngxPopoverTrigger` on the same element as `cngxMenuTrigger`.

`CngxMenuTrigger` wires only the menu behaviour and sets no CSS anchor. A menu
panel rendered into a `cngx-popover-panel` positions against the anchor
`cngxPopoverTrigger` establishes; without it on the same element the panel opens
unanchored at the top-left of the viewport. This is a template rule and runs
under `@angular-eslint/template-parser` on `**/*.html`.

Detection stops at same-element co-presence. Proving which popover a trigger
opens needs cross-element ref resolution and is false-positive prone - and every
menu trigger opening a popover needs the anchor regardless.

## Invalid

```html
<button cngxMenuTrigger [menuPanel]="panel">Open</button>
```

## Valid

```html
<button cngxMenuTrigger cngxPopoverTrigger [menuPanel]="panel">Open</button>
```

## Fix

Add `cngxPopoverTrigger` to the element that carries `cngxMenuTrigger`.

## Configuration

Category `wiring`. `error` in `recommended` and `all`. No options.
