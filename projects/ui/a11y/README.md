# @cngx/ui/a11y

Batteries-included accessibility preferences UI. Ships `CngxA11yPanel`: a plain
in-flow card that renders one labelled control group per accessibility axis
(spacing/density, text size, motion, contrast) bound to the app-wide preference
signals, plus a Reset.

The panel ships no trigger, no overlay, and no placement of its own. Drop
`<cngx-a11y-panel>` wherever it belongs - inline on a settings page, inside a
`CngxDrawer`, inside a `CngxDialog`, or behind your own popover trigger. It is
the same split as `CngxListbox` under `CngxSelect`: the panel owns the axis
controls, the consumer owns where it appears.

## Prerequisite

Install the axis reflectors + preference signals at app root via the
`@cngx/core` aggregator. The panel reads and writes those signals; it installs
nothing itself.

```ts
import { provideA11yPreferences, withPersistence } from '@cngx/core';

bootstrapApplication(AppComponent, {
  providers: [provideA11yPreferences(withPersistence())],
});
```

## Usage

```ts
import { CngxA11yPanel } from '@cngx/ui/a11y';

@Component({
  imports: [CngxA11yPanel],
  template: `<cngx-a11y-panel />`,
})
export class SettingsPage {}
```

Toggling a group writes the matching axis signal, which reflects onto the root
`<html data-*>` attribute live. Reset restores every axis to its library
default and announces the change through the shared live region.

## Configuration

Labels and the rendered axis list come from `CNGX_A11Y_PANEL_CONFIG`. Defaults
are English; override via the cascade.

```ts
import {
  provideA11yPanelConfig,
  withA11yPanelLabels,
  withA11yPanelAxes,
} from '@cngx/ui/a11y';

provideA11yPanelConfig(
  withA11yPanelLabels({ heading: 'Barrierefreiheit', axes: { motion: 'Bewegung' } }),
  withA11yPanelAxes([
    { axis: 'textScale', reset: 'md', options: [
      { value: 'md', label: 'Default' },
      { value: 'lg', label: 'Large' },
    ] },
  ]),
);
```

## Header slot

Project `[cngxA11yPanelHeader]` to replace the default heading:

```html
<cngx-a11y-panel>
  <h2 cngxA11yPanelHeader>Display &amp; motion</h2>
</cngx-a11y-panel>
```

## Public API

- `CngxA11yPanel` - the placeable card.
- `CNGX_A11Y_PANEL_CONFIG` / `provideA11yPanelConfig` / `withA11yPanelLabels` /
  `withA11yPanelAxes` / `injectA11yPanelConfig` - the config cascade.
