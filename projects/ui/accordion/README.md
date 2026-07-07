# @cngx/ui/accordion

APG-correct disclosure organism over the headless `CngxAccordion` brain
(`@cngx/common/interactive`). Renders the heading / button / region trio, derives
expansion from an open-set coordinator, and ships a header slot family, async
status communication, and eleven opt-in CSS skin presets.

## Anatomy

```html
<cngx-accordion-group [multi]="true" [(openIds)]="open">
  <cngx-accordion-item panelId="billing" [state]="billing.status()">
    <span cngxAccordionItemLeading>01</span>
    <span cngxAccordionItemTitle>Billing</span>
    <span cngxAccordionItemSubtitle>Invoices and payment methods</span>
    <span cngxAccordionItemMeta><cngx-time [date]="billing.updated" mode="relative" /></span>

    <ng-template cngxAccordionItemBusy><my-skeleton /></ng-template>
    <ng-template cngxAccordionItemError>Could not load. <button type="button">Retry</button></ng-template>
    <ng-template cngxAccordionItemContent>...</ng-template>
  </cngx-accordion-item>
</cngx-accordion-group>
```

The header row is `[leading] [button: title + subtitle + marker] [meta]`. Leading
and meta are siblings of the button (interactive meta stays valid HTML); the
button's accessible name is pinned to the title only. Subtitle is announced
through `aria-describedby`, never folded into the name.

## Async status

`[state]` takes an `AsyncStatus` or a `CngxAsyncState<unknown>`. The region
carries a reactive `aria-busy`; `loading` shows a skeleton, `refreshing` keeps
the body mounted under a subtle overlay, `error` renders a `role="alert"` (an EN
default message when no `cngxAccordionItemError` slot is given). An errored
collapsed item un-hides its region so the alert is announced.

## Config

`provideAccordionConfig(...)` / `provideAccordionConfigAt(...)` with
`withAccordionLabels({ disabledReason, errorMessage })`,
`withDefaultHeadingLevel(n)`, and `withAccordionTemplates({ icon, busySpinner,
error })`. Library defaults are English.

## Skin presets

Eleven opt-in visual skins ship as CSS. Import the theme once, then add a
`cngx-accordion-skin-<name>` class to the group:

```css
@import '@cngx/themes/cngx.css'; /* carries every skin, inert until opted in */
```

```html
<cngx-accordion-group class="cngx-accordion-skin-editorial">...</cngx-accordion-group>
```

| skin | class | notes |
|-|-|-|
| Editorial | `cngx-accordion-skin-editorial` | mono index leading, hairlines |
| Categorized | `cngx-accordion-skin-categorized` | category-tag leading, elevate-on-open |
| Plus-Minus | `cngx-accordion-skin-plus-minus` | boxed +/- marker |
| Lux | `cngx-accordion-skin-lux` | whitespace, large type |
| Bento | `cngx-accordion-skin-bento` | container-query card grid |
| Section-Bands | `cngx-accordion-skin-section-bands` | inverted full-width band |
| Timeline | `cngx-accordion-skin-timeline` | rail + node (see note) |
| Severity-Spine | `cngx-accordion-skin-severity-spine` | full-height priority spine |
| Data-Grid | `cngx-accordion-skin-data-grid` | table layout (see note) |
| Split-Meta | `cngx-accordion-skin-split-meta` | title + trailing meta |
| Primary-Frame | `cngx-accordion-skin-primary-frame` | solid primary border + glow on open |

Every skin drives the organism through its `--cngx-accordion-*` custom
properties; each colour maps to `--cngx-color-primary`, never a gradient. Skins
live in `@layer cngx.components`, so consumer overrides in `@layer cngx.theme` or
the app layer win.

### Timeline: exclusive mode

The timeline look is exclusive by convention. Bind `[multi]="false"` on the
group so one section opens at a time; the preset does not force it.

```html
<cngx-accordion-group class="cngx-accordion-skin-timeline" [multi]="false">...</cngx-accordion-group>
```

### Data-Grid: caption row

The organism ships no column caption row. Render one yourself above the group and
mirror the skin's column template so the headers align:

```html
<div class="my-dg-caption" style="display:grid; grid-template-columns: 11ch 1fr auto;">
  <span>ID</span><span>Name</span><span>Amount</span>
</div>
<cngx-accordion-group class="cngx-accordion-skin-data-grid">...</cngx-accordion-group>
```

Set `--cngx-accordion-datagrid-columns` to change the column template on both.
