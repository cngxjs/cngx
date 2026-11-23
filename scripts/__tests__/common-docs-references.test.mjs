import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Guard for API references in the `@cngx/common` docs that resolve nowhere.
 * `docs-snippet-selectors.test.mjs` resolves `<cngx-*>` element tags; most of
 * `common` is attribute directives (`cngxFocusTrap`, `cngxRipple`), so this
 * guard resolves the attribute form and the references around a snippet:
 *
 * - `unknown-binding`: `[x]`, `[(x)]` or `(x)` on an element that hosts a cngx
 *   directive or component, where none of the matched owners exposes `x`.
 * - `unknown-tag`: a `<cngx-*>` element no selector declares.
 * - `unknown-attribute`: a bare `cngxFoo` attribute that is neither a selector
 *   attribute nor an input of a matched owner.
 * - `unknown-export-as`: `#ref="name"` where no owner matched on that element
 *   declares `exportAs: 'name'` (Angular forms and router names excepted).
 * - `unknown-host-binding`: a `hostDirectives` entry that forwards an input or
 *   output the named directive does not have.
 * - `unknown-import`: `import { X } from '@cngx/...'` where the entry point
 *   does not export `X`.
 * - `missing-route`: an `<example-url>` route without its story file.
 * - `missing-path`: an `examples/stories/...` prose path that does not exist.
 *
 * Scope: every `README.md` under `projects/common/` and the fenced blocks and
 * `<example-url>` tags in the JSDoc of every `.ts` file there. Snippets are the
 * fenced `html`, `ts` and `typescript` blocks (templates inside `ts` blocks
 * count). Owners resolve against the compodocx JSON export
 * (`npm run docs:json`): selectors, inputs, outputs, `exportAs` and the public
 * names host directives forward.
 *
 * Known failures are tagged with the review slice that owns the folder (see
 * the common review roadmap); each slice's docs PR removes its rows. A new
 * mismatch fails the guard; a row that no longer reproduces fails it too.
 *
 * Needs a fresh `.compodoc/documentation.json`; CI builds it before
 * `test:scripts`.
 */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const COMMON = join(REPO_ROOT, 'projects/common');
const DOC_PATH = join(REPO_ROOT, '.compodoc/documentation.json');

/**
 * `{ slice, file, line, kind, ref }`; the slice is documentation, the diff key
 * is file:line + kind + ref.
 */
const KNOWN_FAILURES = [
  {
    slice: '1 primitives',
    file: 'projects/common/a11y/focus/README.md',
    line: 68,
    kind: 'unknown-export-as',
    ref: 'cngxDialog',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/a11y/focus/README.md',
    line: 68,
    kind: 'unknown-binding',
    ref: 'dialog [cngxFocusTrap]',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/a11y/focus/focus-restore.directive.ts',
    line: 95,
    kind: 'unknown-binding',
    ref: 'div [focusRestoreFallback]',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/a11y/motion/README.md',
    line: 205,
    kind: 'unknown-binding',
    ref: 'cngx-toast-outlet [animationDuration]',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/gestures/README.md',
    line: 341,
    kind: 'missing-path',
    ref: 'examples/stories/common/gestures-demo/',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/guard/README.md',
    line: 242,
    kind: 'missing-path',
    ref: 'examples/stories/common/guard-demo/',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/hoverable/README.md',
    line: 266,
    kind: 'unknown-host-binding',
    ref: 'CngxHoverable hovered',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/speak/README.md',
    line: 408,
    kind: 'missing-path',
    ref: 'examples/stories/common/speak-demo/',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/speak/speak.directive.ts',
    line: 66,
    kind: 'missing-route',
    ref: 'ui/speak/speak-button/material-integration-theme-scss-mat-icon-button',
  },
  {
    slice: '1 primitives',
    file: 'projects/common/interactive/speak/speak.directive.ts',
    line: 68,
    kind: 'missing-route',
    ref: 'ui/speak/speak-button/theming-css-custom-properties',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/data/async-state/README.md',
    line: 8,
    kind: 'unknown-import',
    ref: 'CngxAsyncState from @cngx/common/data',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/data/async-state/README.md',
    line: 326,
    kind: 'unknown-binding',
    ref: 'div [state]',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/data/async-state/async-boundary.directive.ts',
    line: 55,
    kind: 'unknown-tag',
    ref: 'cngx-toast-on',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/data/async-state/async-boundary.directive.ts',
    line: 57,
    kind: 'unknown-tag',
    ref: 'cngx-banner',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/interactive/error-aggregator/README.md',
    line: 97,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/error-aggregator/',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/interactive/error-scope/README.md',
    line: 16,
    kind: 'unknown-binding',
    ref: 'form [cngxErrorScope]',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/interactive/error-scope/error-scope.directive.ts',
    line: 29,
    kind: 'unknown-binding',
    ref: 'form [cngxErrorScope]',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/interactive/error-state/README.md',
    line: 38,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/error-state/',
  },
  {
    slice: '2 async-state',
    file: 'projects/common/interactive/optimistic/README.md',
    line: 273,
    kind: 'missing-path',
    ref: 'examples/stories/common/optimistic-demo/',
  },
  {
    slice: '3 selection-controls',
    file: 'projects/common/interactive/checkbox-group/README.md',
    line: 128,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/checkbox-group/',
  },
  {
    slice: '4 chips',
    file: 'projects/common/display/chip/README.md',
    line: 59,
    kind: 'unknown-attribute',
    ref: 'cngxChipClose',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/chip-group/README.md',
    line: 66,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/chip-group/',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/chip-input/README.md',
    line: 101,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/chip-input/',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/chip-input/README.md',
    line: 86,
    kind: 'unknown-tag',
    ref: 'cngx-toast-on',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/chip-input/chip-input.directive.ts',
    line: 59,
    kind: 'unknown-tag',
    ref: 'cngx-toast-on',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/chip-interaction/README.md',
    line: 61,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/chip-interaction/',
  },
  {
    slice: '4 chips',
    file: 'projects/common/interactive/multi-chip-group/README.md',
    line: 61,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/multi-chip-group/',
  },
  {
    slice: '5 lists-and-menus',
    file: 'projects/common/interactive/listbox/README.md',
    line: 121,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/listbox-search/',
  },
  {
    slice: '5 lists-and-menus',
    file: 'projects/common/interactive/listbox/README.md',
    line: 122,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/listbox-trigger/',
  },
  {
    slice: '5 lists-and-menus',
    file: 'projects/common/interactive/menu/README.md',
    line: 323,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/menu-checkable/',
  },
  {
    slice: '5 lists-and-menus',
    file: 'projects/common/interactive/menu/README.md',
    line: 324,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/menu-submenu/',
  },
  {
    slice: '5 lists-and-menus',
    file: 'projects/common/interactive/menu/README.md',
    line: 325,
    kind: 'missing-path',
    ref: 'examples/stories/common/interactive/menu-trigger/',
  },
  {
    slice: '6 navigation',
    file: 'projects/common/interactive/nav/README.md',
    line: 593,
    kind: 'missing-path',
    ref: 'examples/stories/common/nav-demo/',
  },
  {
    slice: '6 navigation',
    file: 'projects/common/interactive/nav/README.md',
    line: 193,
    kind: 'unknown-binding',
    ref: 'button [active]',
  },
  {
    slice: '6 navigation',
    file: 'projects/common/interactive/nav/README.md',
    line: 551,
    kind: 'unknown-binding',
    ref: 'button [cngxDisclosure]',
  },
  {
    slice: '7 overlays',
    file: 'projects/common/dialog/dialog/README.md',
    line: 65,
    kind: 'unknown-binding',
    ref: 'dialog [cngxFocusTrap]',
  },
  {
    slice: '7 overlays',
    file: 'projects/common/popover/README.md',
    line: 109,
    kind: 'unknown-binding',
    ref: 'cngx-popover-panel [hasFooter]',
  },
  {
    slice: '8 tabs',
    file: 'projects/common/tabs/slots/tab-add-icon.directive.ts',
    line: 21,
    kind: 'missing-route',
    ref: 'ui/tabs/tab-group/addable-tabs',
  },
  {
    slice: '9 stepper',
    file: 'projects/common/stepper/slots/README.md',
    line: 50,
    kind: 'unknown-tag',
    ref: 'cngx-progress-spinner',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 152,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [dataSource]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 152,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [loading]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 152,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [refreshing]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 152,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [error]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 152,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [empty]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 212,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [dataSource]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 212,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [loading]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 212,
    kind: 'unknown-binding',
    ref: 'cngx-treetable [error]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 242,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/data-source/README.md',
    line: 242,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/filter-chips/README.md',
    line: 38,
    kind: 'unknown-binding',
    ref: 'input [filterRef]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/filter-chips/README.md',
    line: 38,
    kind: 'unknown-binding',
    ref: 'input [searchIn]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 8,
    kind: 'unknown-import',
    ref: 'CngxAsyncState from @cngx/common/data',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 23,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 59,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 72,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 154,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 178,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/paginate/README.md',
    line: 178,
    kind: 'unknown-binding',
    ref: 'div [cngxPaginate]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/sort/README.md',
    line: 24,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/sort/README.md',
    line: 103,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/sort/README.md',
    line: 119,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '10 data',
    file: 'projects/common/data/sort/README.md',
    line: 179,
    kind: 'unknown-binding',
    ref: 'div [cngxSort]',
  },
  {
    slice: '11 chart',
    file: 'projects/common/chart/layers/README.md',
    line: 23,
    kind: 'unknown-binding',
    ref: 'cngx-chart [yDomain]',
  },
  {
    slice: '11 chart',
    file: 'projects/common/chart/layers/README.md',
    line: 31,
    kind: 'unknown-binding',
    ref: 'cngx-chart [yDomain]',
  },
  {
    slice: '11 chart',
    file: 'projects/common/chart/layers/README.md',
    line: 41,
    kind: 'unknown-binding',
    ref: 'cngx-chart [yDomain]',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/icon/icon.component.ts',
    line: 21,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/icon/icon.component.ts',
    line: 22,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/icon/icon.component.ts',
    line: 23,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/icon/icon.component.ts',
    line: 24,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-accessory.directive.ts',
    line: 34,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-accessory.directive.ts',
    line: 35,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-accessory.directive.ts',
    line: 36,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-accessory.directive.ts',
    line: 37,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-header.directive.ts',
    line: 34,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-header.directive.ts',
    line: 35,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-header.directive.ts',
    line: 36,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag-group/slots/tag-group-header.directive.ts',
    line: 37,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/README.md',
    line: 106,
    kind: 'missing-path',
    ref: 'examples/stories/common/display/tag/slot-overrides',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-label.directive.ts',
    line: 33,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-label.directive.ts',
    line: 34,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-label.directive.ts',
    line: 35,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-label.directive.ts',
    line: 36,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-prefix.directive.ts',
    line: 29,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-prefix.directive.ts',
    line: 30,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-prefix.directive.ts',
    line: 31,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-prefix.directive.ts',
    line: 32,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-suffix.directive.ts',
    line: 31,
    kind: 'missing-route',
    ref: 'common/display/tag/group-semantic-list',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-suffix.directive.ts',
    line: 32,
    kind: 'missing-route',
    ref: 'common/display/tag/group-with-header-accessory',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-suffix.directive.ts',
    line: 33,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-alignment',
  },
  {
    slice: '12 display',
    file: 'projects/common/display/tag/slots/tag-suffix.directive.ts',
    line: 34,
    kind: 'missing-route',
    ref: 'common/display/tag/layout-only-gap-variants',
  },
  {
    slice: '13 layout-and-theming',
    file: 'projects/common/layout/observers/README.md',
    line: 524,
    kind: 'missing-path',
    ref: 'examples/stories/common/observers-demo/',
  },
  {
    slice: '13 layout-and-theming',
    file: 'projects/common/layout/scroll/README.md',
    line: 364,
    kind: 'missing-path',
    ref: 'examples/stories/common/scroll-demo/',
  },
  {
    slice: '13 layout-and-theming',
    file: 'projects/common/layout/text/README.md',
    line: 471,
    kind: 'missing-path',
    ref: 'examples/stories/common/text-demo/',
  },
];

/** Bindings Angular, the router, forms or the DOM own on any element. */
const NATIVE_BINDINGS = new Set([
  'ngIf',
  'ngForOf',
  'ngModel',
  'ngModelChange',
  'ngClass',
  'ngStyle',
  'ngTemplateOutlet',
  'formControl',
  'formControlName',
  'formGroup',
  'field',
  'routerLink',
  'routerLinkActive',
  'disabled',
  'value',
  'checked',
  'id',
  'hidden',
  'title',
  'href',
  'tabindex',
  'tabIndex',
  'type',
  'name',
  'placeholder',
  'src',
  'alt',
  'role',
  'readonly',
  'required',
  'innerHTML',
  'textContent',
  'inert',
  'open',
  'selected',
  'multiple',
  'min',
  'max',
  'step',
  'for',
  'click',
  'dblclick',
  'contextmenu',
  'input',
  'change',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'keydown',
  'keyup',
  'keypress',
  'submit',
  'reset',
  'toggle',
  'close',
  'cancel',
  'mousedown',
  'mouseup',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'mousemove',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointercancel',
  'touchstart',
  'touchend',
  'touchmove',
  'scroll',
  'wheel',
  'animationend',
  'transitionend',
]);

/** `exportAs` names Angular forms and the router own. */
const NATIVE_EXPORT_AS = new Set(['ngModel', 'ngForm', 'ngModelGroup', 'routerLinkActive']);

function loadExport() {
  if (!existsSync(DOC_PATH)) throw new Error('run npm run docs:json first');
  const exported = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
  if (exported.schemaVersion !== 7) throw new Error('schemaVersion 7 expected');
  const installed = JSON.parse(
    readFileSync(join(REPO_ROOT, 'node_modules/@cngxjs/compodocx/package.json'), 'utf8'),
  ).version;
  if (exported.compodocxVersion !== installed) {
    throw new Error('stale docs JSON: regenerate with npm run docs:json');
  }
  return exported;
}

/** Public binding name of a host-directive `inputs`/`outputs` entry (`internal: public`). */
const publicName = (entry) => {
  const parts = entry.split(':');
  return (parts[1] ?? parts[0]).trim();
};

/**
 * One matcher per comma part of a selector: an optional element name plus the
 * attribute names it requires. `:not(...)` parts are dropped.
 */
function selectorParts(selector) {
  if (typeof selector !== 'string') return [];
  return selector
    .split(',')
    .map((part) => part.replace(/:not\([^)]*\)/g, '').trim())
    .filter(Boolean)
    .map((part) => ({
      tag: part.match(/^([a-z][a-z0-9-]*)/i)?.[1]?.toLowerCase() ?? null,
      attrs: [...part.matchAll(/\[([\w-]+)(?:[~|^$*]?=[^\]]*)?\]/g)].map((m) => m[1].toLowerCase()),
    }));
}

/** Every directive and component as `{ parts, bindings, exportAs }`. */
function resolveOwners(exported) {
  const owners = [];
  for (const owner of [...(exported.components ?? []), ...(exported.directives ?? [])]) {
    const inputs = (owner.inputsClass ?? []).map((i) => i.alias || i.name);
    const outputs = (owner.outputsClass ?? []).map((o) => o.alias || o.name);
    const bindings = new Set([...inputs, ...outputs]);
    // model(): compodocx lists the input and the output under one name.
    for (const name of inputs) if (outputs.includes(name)) bindings.add(`${name}Change`);
    for (const host of owner.hostDirectives ?? []) {
      for (const entry of host.inputs ?? []) bindings.add(publicName(entry));
      for (const entry of host.outputs ?? []) bindings.add(publicName(entry));
    }
    const exportAs = String(owner.exportAs ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    owners.push({ name: owner.name, parts: selectorParts(owner.selector), bindings, exportAs });
  }
  return owners;
}

/** Map of `@cngx/...` entry point to its `public-api.ts`, from tsconfig.base.json paths. */
function entryPoints() {
  const config = readFileSync(join(REPO_ROOT, 'tsconfig.base.json'), 'utf8');
  const map = new Map();
  for (const m of config.matchAll(/"(@cngx\/[\w/-]+)":\s*\[\s*"([^"]+)"/g)) {
    map.set(m[1], join(REPO_ROOT, m[2]));
  }
  return map;
}

const exportCache = new Map();

/** Every name a module exports, following `export *` and `export { } from` re-exports. */
function exportedNames(file, seen = new Set()) {
  if (exportCache.has(file)) return exportCache.get(file);
  const names = new Set();
  if (seen.has(file)) return names;
  seen.add(file);
  const candidates = [file, `${file}.ts`, join(file, 'index.ts'), join(file, 'public-api.ts')];
  const path = candidates.find((c) => existsSync(c) && c.endsWith('.ts'));
  if (!path) return names;
  const src = readFileSync(path, 'utf8');
  for (const m of src.matchAll(/export\s+\*\s+from\s+'([^']+)'/g)) {
    for (const n of exportedNames(resolve(dirname(path), m[1]), seen)) names.add(n);
  }
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const spec of m[1].split(',')) {
      const name = spec
        .replace(/^\s*type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
        .trim();
      if (name) names.add(name);
    }
  }
  const DECL =
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|function\*?|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  for (const m of src.matchAll(DECL)) names.add(m[1]);
  exportCache.set(file, names);
  return names;
}

function filesUnder(dir, predicate) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return entry.name === 'node_modules' ? [] : filesUnder(path, predicate);
    return predicate(entry.name) ? [path] : [];
  });
}

/**
 * Fenced snippet blocks of a file as `{ lang, text, startLine }`. In a `.ts`
 * file the leading `*` of JSDoc lines is stripped first, so only fences inside
 * comments count.
 */
function snippets(path) {
  const isTs = path.endsWith('.ts');
  const lines = readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => (isTs ? (line.match(/^\s*\*\s?(.*)$/)?.[1] ?? null) : line));
  const blocks = [];
  let open = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === null) {
      open = null;
      continue;
    }
    const fence = line.match(/^\s*```(\w*)/);
    if (fence && !open) {
      open = { lang: fence[1].toLowerCase(), body: [], startLine: i + 2 };
      continue;
    }
    if (fence && open) {
      if (['html', 'ts', 'typescript'].includes(open.lang)) {
        blocks.push({ lang: open.lang, text: open.body.join('\n'), startLine: open.startLine });
      }
      open = null;
      continue;
    }
    if (open) open.body.push(line);
  }
  return blocks;
}

const TAG_RE = /<([a-z][a-z0-9-]*)(\s(?:[^>"'`]|"[^"]*"|'[^']*')*)?\/?>/gi;
const ATTR_RE =
  /(\[\([\w.-]+\)\]|\[[\w.@-]+\]|\([\w.-]+\)|#[\w-]+|[\w:@.-]+)(?:\s*=\s*("[^"]*"|'[^']*'))?/g;

/** Attribute tokens of one element: names as written, plus `#ref="value"` pairs. */
function parseAttrs(attrText) {
  const attrs = [];
  for (const m of (attrText ?? '').matchAll(ATTR_RE)) {
    attrs.push({ raw: m[1], value: m[2] ? m[2].slice(1, -1) : null });
  }
  return attrs;
}

/** The plain attribute name an attribute token makes present for selector matching. */
function presentName(raw) {
  if (raw.startsWith('[(')) return raw.slice(2, -2);
  if (raw.startsWith('[')) return raw.slice(1, -1);
  if (raw.startsWith('(') || raw.startsWith('#')) return null;
  return raw;
}

function matchOwners(owners, tag, attrs) {
  const present = new Set(
    attrs
      .map((a) => presentName(a.raw))
      .filter(Boolean)
      .map((n) => n.toLowerCase()),
  );
  const lowerTag = tag.toLowerCase();
  return owners.filter((owner) =>
    owner.parts.some(
      (part) =>
        (part.tag === null || part.tag === lowerTag) &&
        (part.attrs.length > 0 || part.tag !== null) &&
        part.attrs.every((a) => present.has(a)),
    ),
  );
}

const lineOf = (text, index, startLine) => startLine + text.slice(0, index).split('\n').length - 1;

function scanMarkup(block, rel, owners, cngxTags, cngxAttrs) {
  const rows = [];
  let hosts = 0;
  for (const m of block.text.matchAll(TAG_RE)) {
    const tag = m[1];
    const attrs = parseAttrs(m[2]);
    const line = lineOf(block.text, m.index, block.startLine);
    const lowerTag = tag.toLowerCase();
    if (lowerTag.startsWith('cngx-') && !cngxTags.has(lowerTag)) {
      rows.push({ file: rel, line, kind: 'unknown-tag', ref: lowerTag });
      continue;
    }
    const matched = matchOwners(owners, tag, attrs);
    const exportAs = new Set(matched.flatMap((o) => o.exportAs));
    // A template ref with a value needs a matching exportAs on that element,
    // cngx host or not (`<dialog #m="dialog">` fails with NG0301).
    for (const { raw, value } of attrs) {
      if (raw.startsWith('#') && value && !exportAs.has(value) && !NATIVE_EXPORT_AS.has(value)) {
        rows.push({ file: rel, line, kind: 'unknown-export-as', ref: value });
      }
    }
    if (matched.length === 0) continue;
    hosts++;
    const bindings = new Set(matched.flatMap((o) => [...o.bindings]));
    for (const { raw } of attrs) {
      if (raw.startsWith('#')) continue;
      const isBinding = raw.startsWith('[') || raw.startsWith('(');
      const name = isBinding ? raw.replace(/^\[\(|^\[|^\(|\)\]$|\]$|\)$/g, '') : raw;
      if (name.includes('.') || name.startsWith('@') || NATIVE_BINDINGS.has(name)) continue;
      if (name.startsWith('aria-') || name.startsWith('data-') || name.startsWith('attr')) continue;
      if (bindings.has(name)) continue;
      if (!isBinding) {
        if (/^cngx[A-Z]/.test(name) && !cngxAttrs.has(name.toLowerCase())) {
          rows.push({ file: rel, line, kind: 'unknown-attribute', ref: name });
        }
        continue;
      }
      if (cngxAttrs.has(name.toLowerCase()) && raw.startsWith('[') && !raw.startsWith('[(')) {
        // `[cngxFoo]="..."` where cngxFoo is only a selector attribute, not an input.
        rows.push({ file: rel, line, kind: 'unknown-binding', ref: `${tag} [${name}]` });
        continue;
      }
      rows.push({ file: rel, line, kind: 'unknown-binding', ref: `${tag} ${raw}` });
    }
  }
  return { rows, hosts };
}

const HOST_DIRECTIVE_RE =
  /directive:\s*([A-Z]\w*)\s*,((?:\s*(?:inputs|outputs)\s*:\s*\[[^\]]*\]\s*,?)+)/g;

/** `hostDirectives` entries whose forwarded `inputs` / `outputs` the directive does not expose. */
function scanHostDirectives(block, rel, ownersByName) {
  const rows = [];
  for (const m of block.text.matchAll(HOST_DIRECTIVE_RE)) {
    const owner = ownersByName.get(m[1]);
    if (!owner) continue;
    const line = lineOf(block.text, m.index, block.startLine);
    for (const list of m[2].matchAll(/\[([^\]]*)\]/g)) {
      for (const entry of list[1].matchAll(/['"]([^'"]+)['"]/g)) {
        const name = entry[1].split(':')[0].trim();
        if (!owner.bindings.has(name))
          rows.push({ file: rel, line, kind: 'unknown-host-binding', ref: `${m[1]} ${name}` });
      }
    }
  }
  return rows;
}

const IMPORT_RE = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"](@cngx\/[\w/-]+)['"]/g;

function scanImports(block, rel, entries) {
  const rows = [];
  for (const m of block.text.matchAll(IMPORT_RE)) {
    const entry = entries.get(m[2]);
    const line = lineOf(block.text, m.index, block.startLine);
    if (!entry) {
      rows.push({ file: rel, line, kind: 'unknown-import', ref: m[2] });
      continue;
    }
    const names = exportedNames(entry);
    for (const spec of m[1].split(',')) {
      const name = spec
        .replace(/^\s*type\s+/, '')
        .split(/\s+as\s+/)[0]
        .trim();
      if (name && !names.has(name))
        rows.push({ file: rel, line, kind: 'unknown-import', ref: `${name} from ${m[2]}` });
    }
  }
  return rows;
}

const EXAMPLE_URL_RE = /<example-url>\s*\/#\/([^<\s]+)\s*<\/example-url>/g;
const PROSE_PATH_RE = /examples\/stories\/[\w./-]*[\w/]/g;

function scanPaths(path, rel) {
  const rows = [];
  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((text, i) => {
    for (const m of text.matchAll(EXAMPLE_URL_RE)) {
      const route = m[1].replace(/\/$/, '');
      if (!existsSync(join(REPO_ROOT, 'examples/stories', `${route}.story.ts`))) {
        rows.push({ file: rel, line: i + 1, kind: 'missing-route', ref: route });
      }
    }
    for (const m of text.matchAll(PROSE_PATH_RE)) {
      if (!existsSync(join(REPO_ROOT, m[0])))
        rows.push({ file: rel, line: i + 1, kind: 'missing-path', ref: m[0] });
    }
  });
  return rows;
}

function scan() {
  const owners = resolveOwners(loadExport());
  const cngxTags = new Set(
    owners.flatMap((o) => o.parts.map((p) => p.tag)).filter((t) => t && t.startsWith('cngx-')),
  );
  const cngxAttrs = new Set(
    owners.flatMap((o) => o.parts.flatMap((p) => p.attrs)).filter((a) => a.startsWith('cngx')),
  );
  const entries = entryPoints();
  const ownersByName = new Map(owners.map((o) => [o.name, o]));
  const files = filesUnder(
    COMMON,
    (name) => name === 'README.md' || (name.endsWith('.ts') && !name.endsWith('.spec.ts')),
  );
  const rows = [];
  let hosts = 0;
  let blocks = 0;
  for (const path of files.sort()) {
    const rel = relative(REPO_ROOT, path);
    rows.push(...scanPaths(path, rel));
    for (const block of snippets(path)) {
      blocks++;
      const markup = scanMarkup(block, rel, owners, cngxTags, cngxAttrs);
      rows.push(...markup.rows);
      hosts += markup.hosts;
      if (block.lang !== 'html') {
        rows.push(...scanImports(block, rel, entries));
        rows.push(...scanHostDirectives(block, rel, ownersByName));
      }
    }
  }
  return { rows, hosts, blocks, owners: owners.length };
}

const key = (row) => `${row.file}:${row.line} ${row.kind} ${row.ref}`;

/** Rows of `from` left after removing one match per row of `remove`, by key. */
function subtract(from, remove) {
  const counts = new Map();
  for (const row of remove) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  const left = [];
  for (const row of from) {
    const k = key(row);
    if ((counts.get(k) ?? 0) > 0) counts.set(k, counts.get(k) - 1);
    else left.push(row);
  }
  return left;
}

describe('common docs references (repo)', () => {
  const result = scan();

  it('resolves the directive surface and finds snippet hosts', () => {
    expect(result.owners).toBeGreaterThan(300);
    expect(result.blocks).toBeGreaterThan(200);
    expect(result.hosts).toBeGreaterThan(100);
  });

  it('lists every unresolved reference in the known-failure list', () => {
    expect(
      subtract(result.rows, KNOWN_FAILURES).map(key),
      'a doc references an API, route or path that does not exist: fix the doc, never add a row',
    ).toEqual([]);
  });

  it('keeps only references that still fail', () => {
    expect(
      subtract(KNOWN_FAILURES, result.rows).map(key),
      'regenerate with npm run docs:json first; still listed means the doc was fixed - drop the row',
    ).toEqual([]);
  });
});
