import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'RTL: Direction-sensitive surfaces',
  subtitle:
    'Four behaviours that mirror when the writing direction flips: popover placement, submenu side, a bidi number island, and a directional glyph. Use the floating <code>dir</code> toggle to switch the whole page to <code>rtl</code> and watch every panel adapt at once.',
  description:
    'The RTL proof surface. Nothing here ships an <code>[rtl]</code> input; every panel reacts to the ambient <code>dir</code> the document owns. The popover reads <code>injectDirection()</code> and mirrors its placement, so an inline-end popover opens on the left under <code>rtl</code>. The two-level submenu flanks the opposite side and its keyboard arrows swap per the WAI-ARIA APG. The <code>cngx-metric</code> renders its value as an isolated bidi run, so the number keeps its LTR order inside RTL prose. The glyph panel mirrors a consumer-owned arrow the same way cngx mirrors its own disclosure glyphs: a <code>scaleX(-1)</code> driven by the <code>injectDirection()</code> signal, since cngx ships no icon set of its own.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['rtl', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG: keyboard interaction and RTL',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/',
    },
    {
      label: 'MDN: CSS logical properties and values',
      href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values',
    },
  ],
  apiComponents: ['CngxPopover', 'CngxMenuItemSubmenu', 'CngxMetric'],
  moduleImports: [
    "import { injectDirection } from '@cngx/core';",
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxMenuTrigger, CngxMenuItemIcon, CngxMenuItemLabel, CngxMenuItemKbd, CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';",
    "import { CngxMetric } from '@cngx/common/data';",
    "import { CngxIcon } from '@cngx/common/display';",
  ],
  imports: [
    'CngxPopover',
    'CngxPopoverTrigger',
    'CngxMenu',
    'CngxMenuItem',
    'CngxMenuItemSubmenu',
    'CngxMenuTrigger',
    'CngxMenuItemIcon',
    'CngxMenuItemLabel',
    'CngxMenuItemKbd',
    'CngxMetric',
    'CngxIcon',
  ],
  setup: `protected readonly direction = injectDirection();
  protected readonly submenuFallbacks = CNGX_SUBMENU_TRY_FALLBACKS;`,
  template: `
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:24px; align-items:start">

    <section aria-labelledby="rtl-place-h" style="display:flex; flex-direction:column; gap:8px">
      <h3 id="rtl-place-h" style="margin:0">Popover placement</h3>
      <p style="margin:0">Opens inline-end under <code>ltr</code>, inline-start (the left) under <code>rtl</code>.</p>
      <button
        type="button"
        [cngxPopoverTrigger]="placePop"
        (click)="placePop.toggle()"
        class="chip"
        aria-label="Toggle placement popover"
      >
        Open popover
      </button>
      <div cngxPopover #placePop="cngxPopover" placement="right-start" class="demo-popover-tile">
        Flanks the inline-end side. The side swaps when the direction flips.
      </div>
    </section>

    <section aria-labelledby="rtl-submenu-h" style="display:flex; flex-direction:column; gap:8px">
      <h3 id="rtl-submenu-h" style="margin:0">Submenu side</h3>
      <p style="margin:0">The submenu flanks the opposite side; ArrowLeft / ArrowRight swap roles.</p>
      <button
        type="button"
        [cngxMenuTrigger]="fileMenu"
        [cngxPopoverTrigger]="menuPop"
        [popover]="menuPop"
        [haspopup]="'menu'"
        (click)="menuPop.toggle()"
        aria-label="File menu"
        class="chip"
      >
        File
      </button>
      <div cngxPopover #menuPop="cngxPopover" placement="bottom-start">
        <ul cngxMenu [label]="'File'" tabindex="0" #fileMenu="cngxMenu" (itemActivated)="recentPop.hide(); menuPop.hide()">
          <li cngxMenuItem value="new">
            <span cngxMenuItemIcon>N</span>
            <span cngxMenuItemLabel>New</span>
            <kbd cngxMenuItemKbd>Ctrl+N</kbd>
          </li>
          <li cngxMenuItem [cngxMenuItemSubmenu]="recentPop" [submenuMenu]="recentMenu" value="recent">
            <span cngxMenuItemIcon>R</span>
            <span cngxMenuItemLabel>Open Recent</span>
            <kbd cngxMenuItemKbd>&gt;</kbd>
          </li>
          <li cngxMenuItem value="save">
            <span cngxMenuItemIcon>S</span>
            <span cngxMenuItemLabel>Save</span>
            <kbd cngxMenuItemKbd>Ctrl+S</kbd>
          </li>
        </ul>
      </div>
      <div
        cngxPopover
        #recentPop="cngxPopover"
        placement="right-start"
        [exclusive]="false"
        [positionTryFallbacks]="submenuFallbacks"
      >
        <ul cngxMenu [label]="'Recent files'" tabindex="0" #recentMenu="cngxMenu" (itemActivated)="recentPop.hide(); menuPop.hide()">
          <li cngxMenuItem value="recent:plan.md">
            <span cngxMenuItemIcon>F</span>
            <span cngxMenuItemLabel>plan.md</span>
          </li>
          <li cngxMenuItem value="recent:notes.txt">
            <span cngxMenuItemIcon>F</span>
            <span cngxMenuItemLabel>notes.txt</span>
          </li>
        </ul>
      </div>
    </section>

    <section aria-labelledby="rtl-metric-h" style="display:flex; flex-direction:column; gap:8px">
      <h3 id="rtl-metric-h" style="margin:0">Numeric island</h3>
      <p style="margin:0">
        Peak latency was <cngx-metric [value]="1234.5" unit="ms" /> last run. The number holds its LTR order inside the reversed line.
      </p>
    </section>

    <section aria-labelledby="rtl-glyph-h" style="display:flex; flex-direction:column; gap:8px">
      <h3 id="rtl-glyph-h" style="margin:0">Directional glyph</h3>
      <p style="margin:0">A consumer glyph mirrors from the same signal cngx reads. Direction now: <strong>{{ direction() }}</strong>.</p>
      <span style="display:inline-flex; align-items:center; gap:8px">
        <cngx-icon
          size="lg"
          aria-hidden="true"
          [style.display]="'inline-block'"
          [style.transform]="direction() === 'rtl' ? 'scaleX(-1)' : 'none'"
        >&#10152;</cngx-icon>
        <span>points the reading way</span>
      </span>
    </section>

  </div>`,
};
